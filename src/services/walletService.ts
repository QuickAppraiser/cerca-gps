// ==========================================
// CERCA - Wallet/Credits Service
// Handles credits, transactions, and payments
// ==========================================

import { supabase } from './supabase';
import { config } from '../config/environment';

// ==========================================
// Types
// ==========================================

export interface WalletResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'recharge' | 'trip_payment' | 'trip_earning' | 'bonus' | 'refund' | 'withdrawal';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
}

export interface RechargeData {
  userId: string;
  amount: number;
  paymentMethod: 'nequi' | 'daviplata' | 'pse' | 'credit_card';
  reference?: string;
}

export interface PaymentData {
  userId: string;
  tripId: string;
  amount: number;
  paymentMethod: 'credits' | 'cash';
}

// ==========================================
// Development Mode
// ==========================================

const DEV_MODE = config.features.enableMockData;

// Mock transactions for development
const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    userId: 'user_1',
    type: 'trip_payment',
    amount: -8500,
    balanceBefore: 58500,
    balanceAfter: 50000,
    description: 'Viaje a Terminal',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'tx_2',
    userId: 'user_1',
    type: 'recharge',
    amount: 50000,
    balanceBefore: 8500,
    balanceAfter: 58500,
    description: 'Recarga Nequi',
    paymentMethod: 'nequi',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
  },
  {
    id: 'tx_3',
    userId: 'user_1',
    type: 'trip_payment',
    amount: -6200,
    balanceBefore: 14700,
    balanceAfter: 8500,
    description: 'Viaje a Centro',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: 'tx_4',
    userId: 'user_1',
    type: 'bonus',
    amount: 5000,
    balanceBefore: 9700,
    balanceAfter: 14700,
    description: 'Bono de bienvenida',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
  },
];

// ==========================================
// Wallet Service
// ==========================================

export const walletService = {
  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<WalletResult> {
    if (DEV_MODE) {
      console.log('[DEV] Getting balance for user:', userId);
      // Return mock balance
      return { success: true, data: { balance: 50000 } };
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If wallet doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({ user_id: userId, balance: 0 })
            .select()
            .single();

          if (createError) {
            return { success: false, error: 'Error creando billetera' };
          }
          return { success: true, data: { balance: newWallet.balance } };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: { balance: data.balance } };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Recharge credits to user's wallet
   */
  async recharge(data: RechargeData): Promise<WalletResult> {
    if (DEV_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate payment processing
      console.log('[DEV] Processing recharge:', data.amount, 'via', data.paymentMethod);

      // Random success (90% success rate in dev)
      if (Math.random() > 0.1) {
        const transaction: Transaction = {
          id: `tx_${Date.now()}`,
          userId: data.userId,
          type: 'recharge',
          amount: data.amount,
          balanceBefore: 50000,
          balanceAfter: 50000 + data.amount,
          description: `Recarga ${data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1)}`,
          paymentMethod: data.paymentMethod,
          status: 'completed',
          createdAt: new Date(),
        };

        mockTransactions.unshift(transaction);

        return {
          success: true,
          data: {
            transaction,
            newBalance: 50000 + data.amount,
          },
        };
      } else {
        return { success: false, error: 'Error procesando el pago. Intenta de nuevo.' };
      }
    }

    try {
      // Start transaction
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', data.userId)
        .single();

      if (walletError) {
        return { success: false, error: 'Error obteniendo saldo' };
      }

      const currentBalance = wallet.balance;
      const newBalance = currentBalance + data.amount;

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: data.userId,
          type: 'recharge',
          amount: data.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Recarga ${data.paymentMethod}`,
          payment_method: data.paymentMethod,
          reference: data.reference,
          status: 'completed',
        })
        .select()
        .single();

      if (txError) {
        return { success: false, error: 'Error registrando transaccion' };
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', data.userId);

      if (updateError) {
        // Rollback transaction status
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);

        return { success: false, error: 'Error actualizando saldo' };
      }

      return {
        success: true,
        data: {
          transaction,
          newBalance,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Process trip payment with credits
   */
  async payTrip(data: PaymentData): Promise<WalletResult> {
    if (data.paymentMethod === 'cash') {
      // Cash payment doesn't affect wallet
      return { success: true, data: { method: 'cash' } };
    }

    if (DEV_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        userId: data.userId,
        type: 'trip_payment',
        amount: -data.amount,
        balanceBefore: 50000,
        balanceAfter: 50000 - data.amount,
        description: 'Pago de viaje',
        reference: data.tripId,
        status: 'completed',
        createdAt: new Date(),
      };

      mockTransactions.unshift(transaction);

      return {
        success: true,
        data: {
          transaction,
          newBalance: 50000 - data.amount,
        },
      };
    }

    try {
      // Get current balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', data.userId)
        .single();

      if (walletError) {
        return { success: false, error: 'Error obteniendo saldo' };
      }

      if (wallet.balance < data.amount) {
        return { success: false, error: 'Saldo insuficiente' };
      }

      const currentBalance = wallet.balance;
      const newBalance = currentBalance - data.amount;

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: data.userId,
          type: 'trip_payment',
          amount: -data.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: 'Pago de viaje',
          reference: data.tripId,
          status: 'completed',
        })
        .select()
        .single();

      if (txError) {
        return { success: false, error: 'Error registrando pago' };
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', data.userId);

      if (updateError) {
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);

        return { success: false, error: 'Error procesando pago' };
      }

      return {
        success: true,
        data: {
          transaction,
          newBalance,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Add earnings to driver's wallet
   */
  async addDriverEarnings(
    driverId: string,
    tripId: string,
    amount: number,
    commission: number
  ): Promise<WalletResult> {
    const netAmount = amount - commission;

    if (DEV_MODE) {
      console.log('[DEV] Adding driver earnings:', netAmount, '(after', commission, 'commission)');

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        userId: driverId,
        type: 'trip_earning',
        amount: netAmount,
        balanceBefore: 125000,
        balanceAfter: 125000 + netAmount,
        description: `Ganancia de viaje (${((1 - commission / amount) * 100).toFixed(0)}%)`,
        reference: tripId,
        status: 'completed',
        createdAt: new Date(),
      };

      return {
        success: true,
        data: {
          transaction,
          grossAmount: amount,
          commission,
          netAmount,
          newBalance: 125000 + netAmount,
        },
      };
    }

    try {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', driverId)
        .single();

      if (walletError) {
        return { success: false, error: 'Error obteniendo saldo' };
      }

      const currentBalance = wallet.balance;
      const newBalance = currentBalance + netAmount;

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: driverId,
          type: 'trip_earning',
          amount: netAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Ganancia de viaje (comision: $${commission.toLocaleString()})`,
          reference: tripId,
          status: 'completed',
        })
        .select()
        .single();

      if (txError) {
        return { success: false, error: 'Error registrando ganancia' };
      }

      // Update balance
      await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', driverId);

      return {
        success: true,
        data: {
          transaction,
          grossAmount: amount,
          commission,
          netAmount,
          newBalance,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<WalletResult> {
    if (DEV_MODE) {
      const transactions = mockTransactions
        .filter((tx) => tx.userId === userId || tx.userId === 'user_1')
        .slice(offset, offset + limit);

      return { success: true, data: transactions };
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Request a withdrawal (for drivers)
   */
  async requestWithdrawal(
    driverId: string,
    amount: number,
    accountType: 'nequi' | 'daviplata' | 'bank',
    accountNumber: string
  ): Promise<WalletResult> {
    if (DEV_MODE) {
      console.log('[DEV] Withdrawal request:', amount, 'to', accountType, accountNumber);

      if (amount > 125000) {
        return { success: false, error: 'Saldo insuficiente para el retiro' };
      }

      return {
        success: true,
        data: {
          withdrawalId: `wd_${Date.now()}`,
          amount,
          status: 'pending',
          estimatedArrival: '24-48 horas',
        },
      };
    }

    try {
      // Check balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', driverId)
        .single();

      if (walletError || wallet.balance < amount) {
        return { success: false, error: 'Saldo insuficiente' };
      }

      // Create withdrawal request
      const { data: withdrawal, error: wdError } = await supabase
        .from('withdrawals')
        .insert({
          driver_id: driverId,
          amount,
          account_type: accountType,
          account_number: accountNumber,
          status: 'pending',
        })
        .select()
        .single();

      if (wdError) {
        return { success: false, error: 'Error creando solicitud' };
      }

      // Deduct from balance
      const newBalance = wallet.balance - amount;
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', driverId);

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: driverId,
        type: 'withdrawal',
        amount: -amount,
        balance_before: wallet.balance,
        balance_after: newBalance,
        description: `Retiro a ${accountType}`,
        reference: withdrawal.id,
        status: 'pending',
      });

      return {
        success: true,
        data: {
          withdrawalId: withdrawal.id,
          amount,
          status: 'pending',
          estimatedArrival: '24-48 horas',
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Add bonus credits
   */
  async addBonus(
    userId: string,
    amount: number,
    description: string
  ): Promise<WalletResult> {
    if (DEV_MODE) {
      console.log('[DEV] Adding bonus:', amount, '-', description);

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: 'bonus',
        amount,
        balanceBefore: 50000,
        balanceAfter: 50000 + amount,
        description,
        status: 'completed',
        createdAt: new Date(),
      };

      mockTransactions.unshift(transaction);

      return {
        success: true,
        data: {
          transaction,
          newBalance: 50000 + amount,
        },
      };
    }

    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + amount;

      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bonus',
          amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description,
          status: 'completed',
        })
        .select()
        .single();

      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      return {
        success: true,
        data: {
          transaction,
          newBalance,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Issue refund
   */
  async issueRefund(
    userId: string,
    tripId: string,
    amount: number,
    reason: string
  ): Promise<WalletResult> {
    if (DEV_MODE) {
      console.log('[DEV] Issuing refund:', amount, '-', reason);

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: 'refund',
        amount,
        balanceBefore: 50000,
        balanceAfter: 50000 + amount,
        description: `Reembolso: ${reason}`,
        reference: tripId,
        status: 'completed',
        createdAt: new Date(),
      };

      mockTransactions.unshift(transaction);

      return {
        success: true,
        data: {
          transaction,
          newBalance: 50000 + amount,
        },
      };
    }

    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + amount;

      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'refund',
          amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Reembolso: ${reason}`,
          reference: tripId,
          status: 'completed',
        })
        .select()
        .single();

      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      return {
        success: true,
        data: {
          transaction,
          newBalance,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    if (DEV_MODE) {
      return 50000 >= amount;
    }

    try {
      const { data } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      return (data?.balance || 0) >= amount;
    } catch {
      return false;
    }
  },
};

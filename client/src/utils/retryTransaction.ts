/**
 * Utility for retrying failed transactions with exponential backoff
 */

import type { GetTransactionReceiptResponse } from "starknet";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Check if a transaction receipt indicates success
 * Throws an error if the transaction failed
 */
export function checkTransactionSuccess(txReceipt: GetTransactionReceiptResponse): void {
  // Check if receipt has execution_status (SuccessfulTransactionReceiptResponse)
  if ("execution_status" in txReceipt) {
    if (txReceipt.execution_status !== "SUCCEEDED") {
      const revertReason =
        "revert_reason" in txReceipt ? txReceipt.revert_reason : undefined;
      throw new Error(revertReason || "Transaction execution failed");
    }
  }
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  delayMs: 3000,
  exponentialBackoff: false,
  onRetry: () => { },
};

/**
 * Retry a transaction function with automatic retries on failure
 * @param fn Function that returns a Promise (the transaction to execute)
 * @param options Retry configuration options
 * @returns Promise with the transaction result
 */
export async function retryTransaction<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`[RetryTx] Attempt ${attempt}/${opts.maxAttempts}`);

      // Execute the transaction
      const result = await fn();

      // Success!
      if (attempt > 1) {
        console.log(`[RetryTx] ✓ Success on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[RetryTx] ✗ Attempt ${attempt} failed:`, error);

      // If this is not the last attempt, wait and retry
      if (attempt < opts.maxAttempts) {
        // Calculate delay (with optional exponential backoff)
        const delay = opts.delayMs;

        console.log(`[RetryTx] Waiting ${delay}ms before retry...`);

        // Call the retry callback
        opts.onRetry(attempt, lastError);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  console.error(`[RetryTx] ✗ All ${opts.maxAttempts} attempts failed`);
  throw lastError!;
}

/**
 * Retry a transaction with wait for confirmation
 * Useful for Starknet transactions that need waitForTransaction
 */
export async function retryTransactionWithConfirmation<T extends { transaction_hash: string }>(
  executeFn: () => Promise<T>,
  waitFn: (txHash: string) => Promise<void>,
  options: RetryOptions = {},
): Promise<T> {
  return retryTransaction(async () => {
    // Execute the transaction
    const result = await executeFn();

    // Wait for confirmation
    await waitFn(result.transaction_hash);

    return result;
  }, options);
}

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

/**
 * Transaction Handler Utility
 * Provides MongoDB transaction support with fallback for non-replica set environments
 */
const supportsTransactions = () => {
  try {
    // A more robust check for replica set environments
    return (
      mongoose.connection.readyState === 1 &&
      mongoose.connection.client.topology.s.commonState.replicaSetState.name
    );
  } catch {
    return false;
  }
};

/**
 * Execute a block of code with or without a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise} Result of the callback execution
 */
const executeWithOptionalTransaction = asyncHandler(async (callback) => {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction aborted due to error:", error);
      throw error; // Re-throw the error after logging
    } finally {
      session.endSession();
    }
  } else {
    // Execute without transactions for environments that don't support it (e.g., local standalone MongoDB)
    console.warn(
      "Transactions are not supported by this MongoDB setup. Running operation without transaction."
    );
    return await callback(null);
  }
});

module.exports = {
  supportsTransactions,
  executeWithOptionalTransaction,
};

const mongoose = require("mongoose");

// Check if MongoDB instance supports transactions
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

// Helper function to execute a block of code with or without a transaction
const executeWithOptionalTransaction = async (callback) => {
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
    console.warn("Transactions are not supported by this MongoDB setup. Running operation without transaction.");
    return await callback(null);
  }
};

module.exports = {
  supportsTransactions,
  executeWithOptionalTransaction,
};

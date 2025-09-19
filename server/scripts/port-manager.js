#!/usr/bin/env node

const net = require("net");

/**
 * Find an available port starting from the given port
 * @param {number} startPort - The port to start checking from
 * @returns {Promise<number>} - The first available port
 */
function findAvailablePort(startPort = 5000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // Port is in use, try the next one
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Kill process using the specified port
 * @param {number} port - The port to free up
 */
function killProcessOnPort(port) {
  const { exec } = require("child_process");
  const os = require("os");

  return new Promise((resolve, reject) => {
    if (os.platform() === "win32") {
      // Windows
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const lines = stdout.trim().split("\n");
        const pids = new Set();

        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== "0") {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          console.log(`No process found using port ${port}`);
          resolve();
          return;
        }

        const killPromises = Array.from(pids).map((pid) => {
          return new Promise((killResolve, killReject) => {
            exec(`taskkill /PID ${pid} /F`, (killError) => {
              if (killError) {
                console.warn(
                  `Failed to kill process ${pid}: ${killError.message}`
                );
                killResolve();
              } else {
                console.log(`Killed process ${pid} using port ${port}`);
                killResolve();
              }
            });
          });
        });

        Promise.all(killPromises).then(resolve).catch(reject);
      });
    } else {
      // Unix-like systems
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const pids = stdout
          .trim()
          .split("\n")
          .filter((pid) => pid);

        if (pids.length === 0) {
          console.log(`No process found using port ${port}`);
          resolve();
          return;
        }

        const killPromises = pids.map((pid) => {
          return new Promise((killResolve, killReject) => {
            exec(`kill -9 ${pid}`, (killError) => {
              if (killError) {
                console.warn(
                  `Failed to kill process ${pid}: ${killError.message}`
                );
                killResolve();
              } else {
                console.log(`Killed process ${pid} using port ${port}`);
                killResolve();
              }
            });
          });
        });

        Promise.all(killPromises).then(resolve).catch(reject);
      });
    }
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const port = parseInt(args[1]) || 5000;

  switch (command) {
    case "find":
      findAvailablePort(port)
        .then((availablePort) => {
          console.log(`Available port: ${availablePort}`);
          process.exit(0);
        })
        .catch((err) => {
          console.error("Error finding available port:", err);
          process.exit(1);
        });
      break;

    case "kill":
      killProcessOnPort(port)
        .then(() => {
          console.log(`Freed up port ${port}`);
          process.exit(0);
        })
        .catch((err) => {
          console.error("Error killing process:", err);
          process.exit(1);
        });
      break;

    default:
      console.log("Usage:");
      console.log(
        "  node port-manager.js find [port]  - Find available port starting from given port"
      );
      console.log(
        "  node port-manager.js kill [port]  - Kill process using given port"
      );
      process.exit(1);
  }
}

module.exports = { findAvailablePort, killProcessOnPort };

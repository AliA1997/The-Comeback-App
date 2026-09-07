import app from "./app";
import { logger } from "./lib/logger";
import { checkDatabaseTarget } from "./lib/preflight";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Runs after listen, never before: /api/healthz has to answer for the
  // platform health check even when the database is misconfigured, and a
  // container that boots and explains itself beats one that crash-loops.
  void checkDatabaseTarget();
});

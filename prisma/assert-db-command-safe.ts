import { assertDestructiveDbCommandAllowed } from "@/prisma/safety";

const commandName = process.argv[2]?.trim() || "database command";

assertDestructiveDbCommandAllowed(commandName);

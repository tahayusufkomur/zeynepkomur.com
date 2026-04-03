import { bootstrap } from "../src/lib/bootstrap";

bootstrap().then(() => {
  console.log("[dev-reset] Done");
  process.exit(0);
});

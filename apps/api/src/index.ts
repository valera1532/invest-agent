import "./lib/path-alias-register";
import { createApp } from "@/app/create-app";
import { env } from "@/config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API server is running on http://localhost:${env.PORT}`);
});

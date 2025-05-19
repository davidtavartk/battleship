import { httpServer } from "./src/http_server/index";
import { startGameServer } from './src/game_server/app';

const HTTP_PORT = 8181;
const GAME_PORT = 3000;

startGameServer(GAME_PORT);

httpServer.listen(HTTP_PORT, () => {
    console.log(`Started static HTTP server on the ${HTTP_PORT} port. Open UI: http://localhost:${HTTP_PORT}`);
});
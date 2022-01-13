
export function handlePing(e: MessageEvent) {

}

export function register(socket: WebSocket) {
    socket.addEventListener('ping', e => handlePing(e as MessageEvent), true);
}

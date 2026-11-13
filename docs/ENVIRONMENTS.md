# Environments Configuration

## Environment Matrix

| Environment | Base URL | WS URL | Target |
|-------------|----------|--------|--------|
| **Development** | `http://localhost:8080/api` | `ws://localhost:8080/api/ws` | Physical Samsung Galaxy Z Flip 5 over USB (Metro port 8888) |
| **Staging** | `https://staging-api.masova.com/api` | `wss://staging-api.masova.com/api/ws` | Staging cluster |
| **Production** | `https://api.masova.com/api` | `wss://api.masova.com/api/ws` | Live gateway |

## Development Setup with Physical Device

1. Connect Samsung Galaxy Z Flip 5 over USB with USB Debugging enabled.
2. Verify `adb devices` shows the device connected.
3. Run `adb reverse tcp:8888 tcp:8888` to route device port 8888 to Metro on Mac.
4. Ensure Dell server (`localhost:8080`) is reachable on local network.
5. Launch app using `npm run android`.

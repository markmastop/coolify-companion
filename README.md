# Coolify Companion

A mobile companion app for Coolify, built with Expo and React Native. This allows administrators to quickly get insights into servers, applications, and deployments on the go.

## Features

- 📊 **Dashboard** - Real-time overview of server status and running deployments
- 🖥️ **Server Monitoring** - UP/DOWN status of all servers
- 📱 **Application Management** - App overview with logs and redeploy functionality
- 📄 **Live Logs** - Real-time log viewing with auto-refresh
- 🔄 **Smart Polling** - Intelligent refresh strategy (5s for active deploys, 30s for servers)
- 💾 **Offline Cache** - Local storage of last status

## Running Locally

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Expo CLI (optional but recommended)

### Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd coolify-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or using Expo CLI
   npx expo start
   ```

4. **Open the app**
   - **Web**: The app opens automatically in your browser at `http://localhost:8081`
   - **Mobile**: Scan the QR code with the Expo Go app on your phone
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal

### Configuration

On first use, you need to configure your Coolify API:

1. **Coolify Host URL**: `https://your-coolify-domain.com` (the app will append `/api/v1` automatically)
2. **API Token**: Get this via Coolify Dashboard → Settings → API

### Getting API Token

1. Go to your Coolify dashboard
2. Navigate to **Settings** → **API**
3. Create a new API token
4. Copy the token and paste it in the app

### Development Commands

```bash
# Start development server
npm run dev

# Start with Expo CLI
npx expo start

# Start with clear cache
npx expo start --clear

# Build for web
npm run build:web

# Build for production
npx expo build

# Install on iOS simulator
npx expo run:ios

# Install on Android emulator
npx expo run:android

# Lint code
npm run lint

# Check Expo doctor
npx expo doctor

# Update Expo SDK
npx expo install --fix
```

## Using Expo (Web & Mobile)

The project is an Expo Router app. You can run it on the web or on iOS/Android using Expo Go or a custom dev client.

### General (recommended for native dev)

- Install the Expo Dev Client (enables native modules in your own build):
  ```bash
  npx expo install expo-dev-client
  ```

### Start the Web App (development)

- Run the web dev server:
  ```bash
  npx expo start --web
  ```

- Static export for web hosting (builds to `dist/`):
  ```bash
  npx expo export --platform web
  ```

### Start the Mobile App (development)

You have two options:

1) Expo Go (fastest, no build required)
  - Start the dev server:
    ```bash
    npx expo start
    ```
  - Scan the QR code with the Expo Go app on your device (or press `i`/`a` for simulator/emulator).

2) Custom Dev Client (needed if you want your own native runtime)
  - Install the dev client dependency (once):
    ```bash
    npx expo install expo-dev-client
    ```
  - Build and install the app on a simulator/emulator or device:
    ```bash
    npx expo run:ios
    npx expo run:android
    ```
  - Start Metro and reload the app:
    ```bash
    npx expo start
    ```

### EAS (Production Builds and OTA Updates)

- Sign in and initialize (first time):
  ```bash
  npx eas login
  npx eas init
  ```

- Build for the app stores:
  ```bash
  eas build -p ios --profile production
  eas build -p android --profile production
  ```

- Submit to app stores (after a successful build):
  ```bash
  eas submit -p ios   --latest
  eas submit -p android --latest
  ```

- Over‑the‑air (OTA) updates with EAS Update:
  ```bash
  eas update
  ```

- If you use EAS Deploy workflows, you might also run:
  ```bash
  eas deploy --prod
  ```
  Note: `eas update` is the standard command for OTA updates; `eas deploy` is only applicable if you have an EAS Deploy setup configured in your account.

### Expo CLI Commands

```bash
# Install Expo CLI globally (optional)
npm install -g @expo/cli

# Create new Expo project
npx create-expo-app --template

# Start development server
expo start

# Start with specific platform
expo start --web
expo start --ios
expo start --android

# Build for app stores
expo build:ios
expo build:android

# Publish to Expo
expo publish

# Check project health
expo doctor

# Update dependencies
expo install --fix
```

### Project Structure

```
app/
├── (tabs)/              # Tab navigation screens
│   ├── index.tsx        # Dashboard
│   ├── servers.tsx      # Server overview
│   ├── applications.tsx # Application management
│   └── logs.tsx         # Logs viewer
├── _layout.tsx          # Root layout
└── +not-found.tsx       # 404 page

components/              # Reusable components
├── ConfigScreen.tsx     # API configuration
├── StatCard.tsx         # Dashboard statistics
└── StatusChip.tsx       # Status indicators

contexts/                # React Context providers
└── CoolifyContext.tsx   # Coolify API state management

services/                # API services
└── coolifyApi.ts        # Coolify API client

types/                   # TypeScript definitions
└── coolify.ts           # Coolify data types
```

### Troubleshooting

**Module resolution errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Metro bundler issues:**
```bash
# Reset Metro cache
npx expo start --clear
```

**iOS simulator not opening:**
```bash
# Install iOS simulator
npx expo install --ios
# Or manually open Xcode and install simulator
```

**Android emulator issues:**
```bash
# Check Android setup
npx expo doctor
# Install Android dependencies
npx expo install --android
```

**Expo CLI issues:**
```bash
# Update Expo CLI
npm install -g @expo/cli@latest
# Check project health
npx expo doctor
```

## Coolify API Endpoints

The app uses the following Coolify API endpoints:


## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License.

# Coolify Monitor App

Een mobiele monitoring app voor Coolify, gebouwd met Expo en React Native. Hiermee kunnen beheerders onderweg snel inzicht krijgen in servers, applicaties en deployments.

## Features

- 📊 **Dashboard** - Real-time overzicht van server status en lopende deployments
- 🖥️ **Server Monitoring** - UP/DOWN status van alle servers
- 📱 **Application Management** - Overzicht van apps met logs en redeploy functionaliteit
- 📄 **Live Logs** - Real-time log viewing met auto-refresh
- 🔄 **Smart Polling** - Intelligente refresh strategie (5s voor actieve deploys, 30s voor servers)
- 💾 **Offline Cache** - Lokale opslag van laatste status

## Lokaal Draaien

### Vereisten

- Node.js (versie 18 of hoger)
- npm of yarn
- Expo CLI (optioneel, maar aanbevolen)

### Installatie

1. **Clone of download het project**
   ```bash
   # Als je git gebruikt
   git clone <repository-url>
   cd coolify-monitor-app
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Start de development server**
   ```bash
   npm run dev
   ```

4. **Open de app**
   - **Web**: De app opent automatisch in je browser op `http://localhost:8081`
   - **Mobile**: Scan de QR-code met de Expo Go app op je telefoon
   - **iOS Simulator**: Druk op `i` in de terminal
   - **Android Emulator**: Druk op `a` in de terminal

### Configuratie

Bij eerste gebruik moet je je Coolify API configureren:

1. **Coolify Host URL**: `https://jouw-coolify-domein.com`
2. **API Token**: Verkrijg deze via Coolify Dashboard → Settings → API

### API Token Verkrijgen

1. Ga naar je Coolify dashboard
2. Navigeer naar **Settings** → **API**
3. Maak een nieuwe API token aan
4. Kopieer de token en plak deze in de app

### Development Commands

```bash
# Start development server
npm run dev

# Build voor web
npm run build:web

# Lint code
npm run lint
```

### Project Structuur

```
app/
├── (tabs)/              # Tab navigatie screens
│   ├── index.tsx        # Dashboard
│   ├── servers.tsx      # Server overzicht
│   ├── applications.tsx # Applicatie beheer
│   └── logs.tsx         # Logs viewer
├── _layout.tsx          # Root layout
└── +not-found.tsx       # 404 pagina

components/              # Herbruikbare componenten
├── ConfigScreen.tsx     # API configuratie
├── StatCard.tsx         # Dashboard statistieken
└── StatusChip.tsx       # Status indicators

contexts/                # React Context providers
└── CoolifyContext.tsx   # Coolify API state management

services/                # API services
└── coolifyApi.ts        # Coolify API client

types/                   # TypeScript definities
└── coolify.ts           # Coolify data types
```

### Troubleshooting

**Module resolution errors:**
```bash
# Clear cache en herinstalleer
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Metro bundler issues:**
```bash
# Reset Metro cache
npx expo start --clear
```

## Coolify API Endpoints

De app gebruikt de volgende Coolify API endpoints:

- `GET /api/servers` - Server lijst en status
- `GET /api/deployments` - Deployment overzicht
- `GET /api/applications` - Applicatie lijst
- `GET /api/applications/{uuid}/logs` - Applicatie logs
- `POST /api/deploy?uuid={uuid}&force=true` - Trigger redeploy

## Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`)
3. Commit je changes (`git commit -am 'Voeg nieuwe functie toe'`)
4. Push naar de branch (`git push origin feature/nieuwe-functie`)
5. Maak een Pull Request

## License

Dit project is gelicenseerd onder de MIT License.
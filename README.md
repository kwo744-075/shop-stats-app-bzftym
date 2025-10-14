
# Shop Stats App

A React Native + Expo app for district managers to track shop statistics and performance metrics with real-time check-ins and analytics.

## Features

- **Real-time Check-ins**: Shops check in 4 times daily (12pm, 2:30pm, 5pm, 8pm)
- **Performance Tracking**: Track cars, sales, Big 4, coolants, diffs, donations, Mobil1, staffing, and temperature
- **Outlier Detection**: Automatically identify underperforming shops based on configurable goals
- **Rankings System**: View top performers and comprehensive shop rankings
- **District Management**: Organize shops into districts with hierarchical management
- **Data Export**: Export daily and weekly reports to Excel
- **Master Setup**: Secure configuration interface for managing shops, districts, and metric goals
- **Real-time Chat**: Team communication with floating chat interface
- **Dark/Light Mode**: Automatic theme switching based on system preferences

## Technology Stack

- **Frontend**: React Native with Expo 54
- **Backend**: Supabase (PostgreSQL database, real-time subscriptions)
- **State Management**: React Context + Custom Hooks
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: Custom components with Glass Effect styling
- **Notifications**: Expo Notifications for check-in reminders
- **Data Export**: XLSX library for Excel export functionality

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kwo744-075/shop-stats-app-bzftym.git
cd shop-stats-app-bzftym
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
npm run dev
```

### Development Commands

- `npm run dev` - Start development server with tunnel
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run web` - Start web development server
- `npm run lint` - Run ESLint
- `npm run build:web` - Build for web deployment

## Project Structure

```
shop-stats-app-bzftym/
├── app/                          # App screens and routing
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── (home)/              # Home tab screens
│   │   ├── checkin.tsx          # Check-in screen
│   │   ├── profile.tsx          # Profile screen
│   │   └── rankings.tsx         # Rankings screen
│   ├── integrations/            # External service integrations
│   │   └── supabase/           # Supabase client and types
│   └── _layout.tsx             # Root layout
├── components/                  # Reusable UI components
│   ├── CheckInForm.tsx         # Check-in form component
│   ├── DashboardCard.tsx       # Shop dashboard card
│   ├── FloatingChat.tsx        # Chat interface
│   ├── MasterSetupScreen.tsx   # Master configuration
│   └── ...
├── hooks/                      # Custom React hooks
│   ├── useCheckInData.ts       # Check-in data management
│   ├── useHierarchyData.ts     # Shop hierarchy management
│   └── useMasterSetup.ts       # Master setup data
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
│   ├── outlierCalculations.ts  # Outlier detection logic
│   ├── excelExport.ts         # Excel export functionality
│   └── dataMigration.ts       # Data migration utilities
├── contexts/                   # React contexts
├── constants/                  # App constants
└── assets/                     # Static assets
```

## Key Features

### Check-in System

Shops perform check-ins at designated times with the following metrics:
- **Cars**: Number of cars serviced
- **Sales**: Total sales amount
- **Big 4**: Big 4 services performed
- **Coolants**: Coolant services
- **Diffs**: Differential services
- **Donations**: Donation amount
- **Mobil1**: Mobil1 services
- **Staffing**: Staff count
- **Temperature**: Service quality indicator (Red/Yellow/Green)

### Outlier Detection

The app automatically identifies outlier shops based on:
- Configurable metric goals set in Master Setup
- Shops missing 3+ goals are marked as outliers
- Real-time outlier status updates
- Visual indicators on dashboard cards

### Rankings System

- **Top Performers**: Top 10 shops by performance score
- **Full Rankings**: Complete shop performance rankings
- **Performance Metrics**: Detailed breakdown of each metric
- **Percentage Scoring**: Performance as percentage of goals

### Master Setup

Secure configuration interface (password: "take5") for:
- **Shop Management**: Add, edit, delete, and toggle shops
- **District Organization**: Create districts and assign shops
- **Metric Goals**: Set performance targets for outlier detection
- **Data Validation**: Prevent deletion of shops assigned to districts

## Database Schema

The app uses Supabase with the following main tables:

- `shops`: Shop information and status
- `districts`: District organization
- `check_ins`: Daily check-in data
- `metric_goals`: Performance targets
- `weekly_summaries`: Aggregated weekly data

All tables implement Row Level Security (RLS) for data protection.

## Deployment

The app is configured for deployment with:

- **EAS Build**: Expo Application Services for building
- **GitHub Actions**: Automated CI/CD pipeline
- **Over-the-Air Updates**: Quick updates without app store approval
- **Multi-platform**: iOS, Android, and Web support

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [DEPLOYMENT.md](DEPLOYMENT.md) guide for deployment help
- Review the Expo and Supabase documentation

## Acknowledgments

- Built with Expo and React Native
- Backend powered by Supabase
- UI components inspired by modern mobile design patterns
- Glass effect styling for premium user experience

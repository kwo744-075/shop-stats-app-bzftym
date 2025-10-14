
# Shop Stats App - District Manager Dashboard

A React Native + Expo 54 application designed for district managers to track shop statistics and performance metrics with real-time check-ins and analytics.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native 0.81.4 with Expo 54
- **Navigation**: Expo Router with file-based routing
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks + Context API
- **UI Components**: Custom components with Glass Effect
- **Animations**: React Native Reanimated 4.1
- **Notifications**: Expo Notifications

### Key Features
- **Multi-mode Interface**: Shop mode and District Manager mode
- **Real-time Check-ins**: 4 daily check-in times (12pm, 2:30pm, 5pm, 8pm)
- **Performance Analytics**: Comprehensive metrics tracking and outlier detection
- **Rankings System**: Top performers and outlier identification
- **Data Export**: Excel export functionality for daily/weekly reports
- **Chat System**: Built-in communication system
- **Master Setup**: Configurable goals and thresholds

## 📊 Data Models

### Core Entities
- **Shops**: Individual shop locations with performance metrics
- **Districts**: Groupings of shops under district managers
- **Check-ins**: Time-stamped performance data submissions
- **Metric Goals**: Configurable performance targets
- **Rankings**: Calculated performance rankings and outliers

### Tracked Metrics
- Cars serviced
- Sales revenue
- Big 4 services
- Coolant services
- Differential services
- Donations
- Mobil1 services
- Staffing levels
- Temperature readings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Building
```bash
# Web build
npm run build:web

# Android build
npm run build:android
```

## 🔧 Configuration

### Environment Variables
Set up the following in your Supabase project:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Database Setup
The app automatically creates the necessary tables and RLS policies in Supabase:
- `shops`
- `districts`
- `check_ins`
- `metric_goals`

## 📱 App Structure

### Navigation
- **Home**: Dashboard with district/shop overview
- **Check-in**: Data entry forms for shop metrics
- **Rankings**: Performance rankings and outlier detection
- **Profile**: Settings and master setup

### Key Components
- `CheckInForm`: Multi-time slot data entry
- `DashboardCard`: Metric display cards
- `FloatingTabBar`: Custom navigation bar
- `MasterSetupScreen`: Configuration interface
- `FloatingChat`: Communication system

## 🔄 Data Flow

1. **Check-in Process**: Shops submit metrics 4 times daily
2. **Data Aggregation**: Real-time calculation of totals and percentages
3. **Outlier Detection**: Automatic identification of underperforming shops
4. **Rankings Calculation**: Performance scoring and ranking
5. **Export Generation**: Excel reports for analysis

## 🎯 Performance Features

### Outlier Detection
- Compares shop performance against configurable goals
- Identifies shops missing 3+ metrics vs targets
- Visual indicators for outlier status

### Rankings System
- Top 10 performers showcase
- Full ranking list with performance scores
- Percentage-based scoring system

### Real-time Updates
- Live data synchronization via Supabase
- Instant metric updates across all views
- Push notifications for check-in reminders

## 🔐 Security

### Row Level Security (RLS)
All database tables implement RLS policies to ensure:
- Shops can only access their own data
- District managers see only their assigned shops
- Secure data isolation between districts

## 📈 Analytics

### Metrics Tracking
- Daily, weekly, and monthly aggregations
- Percentage calculations for all metrics
- Running totals and comparisons
- Temperature monitoring with color coding

### Export Capabilities
- Excel export for daily/weekly data
- Customizable report formats
- Historical data analysis

## 🛠️ Development

### Code Structure
- `app/`: Main application screens and routing
- `components/`: Reusable UI components
- `hooks/`: Custom React hooks for data management
- `types/`: TypeScript type definitions
- `utils/`: Utility functions and helpers
- `contexts/`: React context providers

### Best Practices
- TypeScript for type safety
- Custom hooks for data management
- Modular component architecture
- Consistent styling with theme support
- Error handling and logging

## 🚀 Deployment

### GitHub Integration
- Repository: https://github.com/kwo744-075/shop-stats-app-bzftym
- CI/CD pipeline with GitHub Actions
- Automated testing and building
- Preview builds for development branch

### Expo Application Services (EAS)
- Production builds and updates
- Over-the-air updates
- App store deployment ready

## 📞 Support

For technical support or feature requests, please create an issue in the GitHub repository.

## 📄 License

MIT License - see LICENSE file for details.

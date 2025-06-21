import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  Camera, 
  TreePine, 
  Users, 
  MapPin, 
  Calendar,
  Upload,
  Download,
  Search,
  Settings
} from 'lucide-react';

const QuickActions = ({ className = '' }) => {
  const quickActions = [
    {
      title: 'Add Member',
      description: 'Add a new family member',
      icon: UserPlus,
      link: '/add',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      title: 'Photo Gallery',
      description: 'View and organize photos',
      icon: Camera,
      link: '/gallery',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700'
    },
    {
      title: 'Family Tree',
      description: 'Explore family connections',
      icon: TreePine,
      link: '/visual-tree',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      title: 'All Members',
      description: 'Browse family members',
      icon: Users,
      link: '/members',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-700'
    },
    {
      title: 'Family Map',
      description: 'See locations worldwide',
      icon: MapPin,
      link: '/map',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    {
      title: 'Timeline',
      description: 'View family history',
      icon: Calendar,
      link: '/timeline',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-700'
    }
  ];

  const utilityActions = [
    {
      title: 'Import Data',
      description: 'Import from CSV',
      icon: Upload,
      link: '/import-csv',
      color: 'from-gray-500 to-gray-600'
    },
    {
      title: 'Settings',
      description: 'App preferences',
      icon: Settings,
      link: '/settings',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <Link
                key={index}
                to={action.link}
                className={`group ${action.bgColor} ${action.borderColor} border rounded-lg p-4 
                           hover:shadow-md transition-all duration-300 transform hover:-translate-y-1
                           hover:border-opacity-75 dark:hover:border-opacity-75`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white 
                                  group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 
                                   dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Utility Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Utilities
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {utilityActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <Link
                key={index}
                to={action.link}
                className="group flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 
                           rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                           border border-gray-200 dark:border-gray-600"
              >
                <div className={`p-1 rounded bg-gradient-to-r ${action.color} text-white`}>
                  <IconComponent className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 
                               group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  {action.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 
                      rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Pro Tip: Use Global Search
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">
                Ctrl+K
              </kbd> anywhere in the app to quickly search for family members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
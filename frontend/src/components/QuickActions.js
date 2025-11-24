import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  Camera, 
  Users, 
  MapPin, 
  Calendar,
  Search
} from 'lucide-react';
import SiteMetrics from './SiteMetrics';

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

      {/* Site Metrics */}
      <SiteMetrics />
    </div>
  );
};

export default QuickActions;
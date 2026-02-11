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

const QuickActions = ({ className = '' }) => {
  const quickActions = [
    {
      title: 'Add Member',
      description: 'Add a new family member',
      icon: UserPlus,
      link: '/add',
      color: 'from-vine-500 to-vine-600',
      bgColor: 'bg-vine-50 dark:bg-vine-900/20',
      borderColor: 'border-vine-200 dark:border-vine-700'
    },
    {
      title: 'Photo Gallery',
      description: 'View and organize photos',
      icon: Camera,
      link: '/gallery',
      color: 'from-vine-leaf to-vine-dark',
      bgColor: 'bg-vine-50 dark:bg-vine-900/20',
      borderColor: 'border-vine-200 dark:border-vine-700'
    },
    {
      title: 'All Members',
      description: 'Browse family members',
      icon: Users,
      link: '/members',
      color: 'from-vine-sage to-vine-leaf',
      bgColor: 'bg-vine-50 dark:bg-vine-900/20',
      borderColor: 'border-vine-200 dark:border-vine-700'
    },
    {
      title: 'Family Map',
      description: 'See locations worldwide',
      icon: MapPin,
      link: '/map',
      color: 'from-vine-600 to-vine-dark',
      bgColor: 'bg-vine-50 dark:bg-vine-900/20',
      borderColor: 'border-vine-200 dark:border-vine-700'
    },
    {
      title: 'Timeline',
      description: 'View family history',
      icon: Calendar,
      link: '/timeline',
      color: 'from-vine-500 to-vine-leaf',
      bgColor: 'bg-vine-50 dark:bg-vine-900/20',
      borderColor: 'border-vine-200 dark:border-vine-700'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-vine-dark dark:text-white font-heading mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-vine-600" />
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
                    <h3 className="font-semibold text-vine-dark dark:text-white group-hover:text-vine-600
                                   dark:group-hover:text-vine-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-vine-sage dark:text-secondary-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
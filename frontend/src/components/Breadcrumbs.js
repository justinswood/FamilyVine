import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  
  // Don't show breadcrumbs on home page or login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  // Create breadcrumb items based on current path
  const createBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [
      { label: 'Home', path: '/', icon: Home }
    ];

    // Map path segments to readable labels
    const segmentLabels = {
      'members': 'Family Members',
      'add': 'Add Member',
      'edit': 'Edit Member',
      'gallery': 'Photo Gallery',
      'visual-tree': 'Family Tree',
      'enhanced-tree': 'Enhanced Tree',
      'debug-tree': 'Debug Tree',
      'family-tree': 'Family Tree',
      'map': 'Family Map',
      'timeline': 'Timeline',
      'calendar': 'Calendar',
      'settings': 'Settings',
      'import-csv': 'Import Data'
    };

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip numeric IDs in breadcrumbs (they're not very helpful)
      if (/^\d+$/.test(segment)) {
        // For member IDs, show "Member Details" instead
        if (pathSegments[index - 1] === 'members') {
          breadcrumbs.push({
            label: 'Member Details',
            path: currentPath
          });
        } else if (pathSegments[index - 1] === 'gallery') {
          breadcrumbs.push({
            label: 'Album',
            path: currentPath
          });
        } else if (pathSegments[index - 1] === 'family-tree') {
          breadcrumbs.push({
            label: 'Tree View',
            path: currentPath
          });
        }
        return;
      }

      // Handle special cases
      if (segment === 'edit' && pathSegments[index - 2] === 'members') {
        breadcrumbs.push({
          label: 'Edit Member',
          path: currentPath
        });
        return;
      }

      // Use mapped label or capitalize the segment
      const label = segmentLabels[segment] || 
                   segment.split('-').map(word => 
                     word.charAt(0).toUpperCase() + word.slice(1)
                   ).join(' ');

      breadcrumbs.push({
        label,
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = createBreadcrumbs();

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <ol className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const IconComponent = crumb.icon;

            return (
              <li key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-1" />
                )}
                
                {isLast ? (
                  <span className="flex items-center gap-1 text-gray-900 dark:text-gray-100 font-medium">
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 
                               hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
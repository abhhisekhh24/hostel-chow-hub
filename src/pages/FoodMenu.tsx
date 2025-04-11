
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Define types for the menu data
type ScheduledMenu = {
  id: string;
  date: string;
  meal_type: string;
  items: {
    breakfast?: string[];
    lunch?: string[];
    snacks?: string[];
    dinner?: string[];
    [key: string]: string[] | undefined;
  };
  published: boolean;
};

// Helper to determine the current day
const getCurrentDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = new Date().getDay();
  return days[currentDayIndex];
};

// Create a formatted date string for today
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Fallback menu data for days without scheduled menus
const fallbackWeeklyMenu = {
  monday: {
    breakfast: 'Idli, Vada, Sambar, Coconut Chutney, Coffee/Tea',
    lunch: 'Rice, Dal, Aloo Gobi, Chapati, Curd, Pickle',
    snacks: 'Biscuits, Coffee/Tea',
    dinner: 'Chapati, Paneer Butter Masala, Jeera Rice, Salad'
  },
  tuesday: {
    breakfast: 'Poha, Boiled Eggs, Bread, Jam, Coffee/Tea',
    lunch: 'Rice, Rajma, Mixed Vegetable, Chapati, Raita',
    snacks: 'Samosa, Coffee/Tea',
    dinner: 'Chapati, Chicken Curry, Rice, Salad, Ice Cream'
  },
  wednesday: {
    breakfast: 'Dosa, Coconut Chutney, Upma, Coffee/Tea',
    lunch: 'Rice, Dal Makhani, Bhindi Fry, Chapati, Curd',
    snacks: 'Vada Pav, Coffee/Tea',
    dinner: 'Chapati, Egg Curry, Veg Pulao, Raita'
  },
  thursday: {
    breakfast: 'Paratha, Curd, Fruits, Coffee/Tea',
    lunch: 'Rice, Kadhi, Aloo Matar, Chapati, Pickle',
    snacks: 'Kachori, Coffee/Tea',
    dinner: 'Chapati, Dal Tadka, Veg Biryani, Salad'
  },
  friday: {
    breakfast: 'Bread Omelette, Cornflakes, Milk, Coffee/Tea',
    lunch: 'Rice, Chole, Aloo Jeera, Chapati, Raita',
    snacks: 'Pav Bhaji, Coffee/Tea',
    dinner: 'Chapati, Mix Veg Curry, Fried Rice, Gulab Jamun'
  },
  saturday: {
    breakfast: 'Puri, Bhaji, Sprouts, Coffee/Tea',
    lunch: 'Rice, Dal Fry, Gobi Matar, Chapati, Curd',
    snacks: 'Bread Pakora, Coffee/Tea',
    dinner: 'Chapati, Fish Curry, Jeera Rice, Salad'
  },
  sunday: {
    breakfast: 'Chole Bhature, Fruits, Coffee/Tea',
    lunch: 'Rice, Sambar, Rasam, Chapati, Papad, Sweet',
    snacks: 'French Fries, Coffee/Tea',
    dinner: 'Chapati, Mutton/Paneer Curry, Pulao, Raita, Ice Cream'
  }
};

const FoodMenu = () => {
  const [activeDay, setActiveDay] = useState(getCurrentDay());
  
  // Fetch scheduled menus from Supabase
  const { data: scheduledMenus = [], isLoading } = useQuery({
    queryKey: ['scheduledMenus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_menus')
        .select('*')
        .eq('published', true)
        .order('date');
      
      if (error) {
        console.error('Error fetching menus:', error);
        return [];
      }
      
      return data as ScheduledMenu[];
    }
  });

  // Group menus by day of the week
  const menusByDay = React.useMemo(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const grouped: Record<string, Record<string, string>> = {};
    
    // Initialize with fallback data
    days.forEach(day => {
      grouped[day] = { ...fallbackWeeklyMenu[day as keyof typeof fallbackWeeklyMenu] };
    });
    
    // Replace with actual data where available
    if (scheduledMenus.length > 0) {
      // Find today's date
      const today = getTodayDateString();
      
      // Get menus for today and the next 6 days
      const relevantMenus = scheduledMenus.filter(menu => {
        const menuDate = new Date(menu.date);
        const todayDate = new Date(today);
        // Only include menus from today onwards
        return menuDate >= todayDate;
      });
      
      // Sort and take only the next 7 days
      relevantMenus.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Replace fallback data with actual data
      relevantMenus.forEach(menu => {
        const menuDate = new Date(menu.date);
        const dayIndex = menuDate.getDay();
        const dayName = days[dayIndex];
        
        // Get menu items for this day's meal type
        if (menu.items && menu.meal_type) {
          // Convert array to string format for display
          const itemsString = Array.isArray(menu.items) 
            ? menu.items.join(', ')
            : typeof menu.items === 'object' && menu.items[menu.meal_type] 
              ? menu.items[menu.meal_type]?.join(', ')
              : '';
          
          if (itemsString) {
            grouped[dayName] = {
              ...grouped[dayName],
              [menu.meal_type]: itemsString
            };
          }
        }
      });
    }
    
    return grouped;
  }, [scheduledMenus]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Weekly Food Menu</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-mess-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
            <div className="px-4 overflow-x-auto">
              <TabsList className="grid grid-cols-7 mb-4">
                <TabsTrigger 
                  value="monday" 
                  className={`py-2 ${activeDay === 'monday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Monday
                </TabsTrigger>
                <TabsTrigger 
                  value="tuesday"
                  className={`py-2 ${activeDay === 'tuesday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Tuesday
                </TabsTrigger>
                <TabsTrigger 
                  value="wednesday"
                  className={`py-2 ${activeDay === 'wednesday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Wednesday
                </TabsTrigger>
                <TabsTrigger 
                  value="thursday"
                  className={`py-2 ${activeDay === 'thursday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Thursday
                </TabsTrigger>
                <TabsTrigger 
                  value="friday"
                  className={`py-2 ${activeDay === 'friday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Friday
                </TabsTrigger>
                <TabsTrigger 
                  value="saturday"
                  className={`py-2 ${activeDay === 'saturday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Saturday
                </TabsTrigger>
                <TabsTrigger 
                  value="sunday"
                  className={`py-2 ${activeDay === 'sunday' ? 'bg-mess-600 text-white' : ''}`}
                >
                  Sunday
                </TabsTrigger>
              </TabsList>
            </div>
            
            {Object.keys(menusByDay).map((day) => (
              <TabsContent key={day} value={day} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="bg-mess-100 dark:bg-mess-900">
                      <CardTitle className="text-mess-700 dark:text-mess-300">Breakfast</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>{menusByDay[day]?.breakfast}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="bg-mess-100 dark:bg-mess-900">
                      <CardTitle className="text-mess-700 dark:text-mess-300">Lunch</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>{menusByDay[day]?.lunch}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="bg-mess-100 dark:bg-mess-900">
                      <CardTitle className="text-mess-700 dark:text-mess-300">Snacks</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>{menusByDay[day]?.snacks}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="bg-mess-100 dark:bg-mess-900">
                      <CardTitle className="text-mess-700 dark:text-mess-300">Dinner</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>{menusByDay[day]?.dinner}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default FoodMenu;

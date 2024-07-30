import {useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const usePendingData = () => {
  const getPendingData = useCallback(async (key: string) => {
    try {
      const pendingData = await AsyncStorage.getItem(key);
      return pendingData ? JSON.parse(pendingData) : [];
    } catch (error) {
      console.error(`Error getting ${key} data:`, error);
      return [];
    }
  }, []);

  const savePendingData = useCallback(
    async (key: string, data: any) => {
      try {
        const pendingData = await getPendingData(key);
        pendingData.push(data);
        await AsyncStorage.setItem(key, JSON.stringify(pendingData));
      } catch (error) {
        console.error(`Error saving ${key} data:`, error);
      }
    },
    [getPendingData],
  );

  return {getPendingData, savePendingData};
};

export default usePendingData;

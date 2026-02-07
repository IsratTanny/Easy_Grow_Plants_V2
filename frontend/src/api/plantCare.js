import axios from './axios';

export const getPlantCategories = async () => {
    try {
        const response = await axios.get('/plant-care/categories/');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getPlantVarieties = async (categoryId) => {
    try {
        const response = await axios.get(`/plant-care/varieties/?category=${categoryId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getPlantVarietyDetails = async (varietyId) => {
    try {
        const response = await axios.get(`/plant-care/varieties/${varietyId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

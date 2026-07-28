const axios = require('axios');
const httpStatus = require('http-status').status;
const faqRepository = require('./faqs.repository');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const { toCamelCaseObject, toCamelCaseArray } = require('../../utils/caseConverter');

const getAiServiceUrl = () => {
  return process.env.AI_SERVICE_URL || `http://127.0.0.1:${process.env.AI_SERVICE_PORT || 2111}`;
};

const syncFaqToAi = async (faq) => {
  if (!faq.IsActive) return; // Only sync active FAQs
  
  const text = `Q: ${faq.Question}\nA: ${faq.Answer}`;
  const sourceName = `FAQ-${faq.FaqID}`;
  
  try {
    const url = `${getAiServiceUrl()}/api/ingest/text`;
    await axios.post(url, {
      text,
      source_name: sourceName,
      collection: 'master_knowledge',
      metadata: { type: 'faq', FaqID: faq.FaqID }
    });
    logger.info(`Synced FAQ-${faq.FaqID} to AI Service`);
  } catch (error) {
    logger.error(`Error syncing FAQ-${faq.FaqID} to AI Service:`, error.message);
  }
};

const removeFaqFromAi = async (faqId) => {
  const sourceName = `FAQ-${faqId}`;
  try {
    const url = `${getAiServiceUrl()}/api/ingest/collection/master_knowledge/source/${sourceName}`;
    await axios.delete(url);
    logger.info(`Removed FAQ-${faqId} from AI Service`);
  } catch (error) {
    logger.error(`Error removing FAQ-${faqId} from AI Service:`, error.message);
  }
};

const getAllFAQs = async () => {
  const faqs = await faqRepository.getAllFAQs();
  return toCamelCaseArray(faqs);
};

const getFAQById = async (id) => {
  const faq = await faqRepository.getFAQById(id);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }
  return toCamelCaseObject(faq);
};

const createFAQ = async (faqData) => {
  const newFAQ = await faqRepository.createFAQ(faqData);
  await syncFaqToAi(newFAQ);
  return toCamelCaseObject(newFAQ);
};

const updateFAQ = async (id, faqData) => {
  const existingFAQ = await faqRepository.getFAQById(id);
  if (!existingFAQ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }

  const updatedFAQ = await faqRepository.updateFAQ(id, faqData);

  // Always remove the old one, and then sync if it's active
  await removeFaqFromAi(id);
  if (updatedFAQ.IsActive) {
    await syncFaqToAi(updatedFAQ);
  }

  return toCamelCaseObject(updatedFAQ);
};

const deleteFAQ = async (id) => {
  const existingFAQ = await faqRepository.getFAQById(id);
  if (!existingFAQ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ không tồn tại.');
  }

  await faqRepository.deleteFAQ(id);
  await removeFaqFromAi(id);
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};

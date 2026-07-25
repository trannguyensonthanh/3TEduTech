const { sql, getConnection } = require('../../database/connection');
const logger = require('../../utils/logger');

const getAllFAQs = async () => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM FAQs ORDER BY SortOrder ASC, CreatedAt DESC
    `);
    return result.recordset;
  } catch (error) {
    logger.error('Error in getAllFAQs repository:', error);
    throw error;
  }
};

const getFAQById = async (id) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('FaqID', sql.Int, id)
      .query(`SELECT * FROM FAQs WHERE FaqID = @FaqID`);
    return result.recordset[0];
  } catch (error) {
    logger.error(`Error in getFAQById (${id}):`, error);
    throw error;
  }
};

const createFAQ = async (faqData) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('Question', sql.NVarChar(sql.MAX), faqData.Question)
      .input('Answer', sql.NVarChar(sql.MAX), faqData.Answer)
      .input('IsActive', sql.Bit, faqData.IsActive !== undefined ? faqData.IsActive : 1)
      .input('SortOrder', sql.Int, faqData.SortOrder || 0)
      .query(`
        INSERT INTO FAQs (Question, Answer, IsActive, SortOrder)
        OUTPUT INSERTED.*
        VALUES (@Question, @Answer, @IsActive, @SortOrder)
      `);
    return result.recordset[0];
  } catch (error) {
    logger.error('Error in createFAQ repository:', error);
    throw error;
  }
};

const updateFAQ = async (id, faqData) => {
  try {
    const pool = await getConnection();
    const request = pool.request().input('FaqID', sql.Int, id);

    let query = 'UPDATE FAQs SET UpdatedAt = GETDATE()';
    
    if (faqData.Question !== undefined) {
      request.input('Question', sql.NVarChar(sql.MAX), faqData.Question);
      query += ', Question = @Question';
    }
    if (faqData.Answer !== undefined) {
      request.input('Answer', sql.NVarChar(sql.MAX), faqData.Answer);
      query += ', Answer = @Answer';
    }
    if (faqData.IsActive !== undefined) {
      request.input('IsActive', sql.Bit, faqData.IsActive);
      query += ', IsActive = @IsActive';
    }
    if (faqData.SortOrder !== undefined) {
      request.input('SortOrder', sql.Int, faqData.SortOrder);
      query += ', SortOrder = @SortOrder';
    }

    query += ' OUTPUT INSERTED.* WHERE FaqID = @FaqID';

    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    logger.error(`Error in updateFAQ repository (${id}):`, error);
    throw error;
  }
};

const deleteFAQ = async (id) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('FaqID', sql.Int, id)
      .query(`DELETE FROM FAQs WHERE FaqID = @FaqID`);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    logger.error(`Error in deleteFAQ repository (${id}):`, error);
    throw error;
  }
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};

const Joi = require('joi');

const createFAQ = {
  body: Joi.object().keys({
    Question: Joi.string().required(),
    Answer: Joi.string().required(),
    IsActive: Joi.boolean().default(true),
    SortOrder: Joi.number().integer().default(0),
  }),
};

const updateFAQ = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  body: Joi.object()
    .keys({
      Question: Joi.string(),
      Answer: Joi.string(),
      IsActive: Joi.boolean(),
      SortOrder: Joi.number().integer(),
    })
    .min(1),
};

const deleteFAQ = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

const getFAQ = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

module.exports = {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQ,
};

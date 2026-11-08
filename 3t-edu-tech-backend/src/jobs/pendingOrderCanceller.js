const cron = require('node-cron');
const logger = require('../utils/logger');
const { getConnection, sql } = require('../database/connection');
const OrderStatus = require('../core/enums/OrderStatus');
const promotionRepository = require('../api/promotions/promotions.repository');

const PENDING_ORDER_TIMEOUT_MINUTES = parseInt(
  process.env.PENDING_ORDER_TIMEOUT_MINUTES || '60',
  10
);

/**
 * Hàm tìm và hủy các đơn hàng PENDING_PAYMENT đã quá hạn.
 */
const cancelOverduePendingOrders = async () => {
  logger.info('[CRON_JOB] Checking for overdue pending orders...');
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  let committed = false;
  try {
    await transaction.begin();

    const cutoffTime = new Date(
      Date.now() - PENDING_ORDER_TIMEOUT_MINUTES * 60 * 1000
    );

    const findRequest = transaction.request();
    findRequest.input(
      'PendingStatus',
      sql.VarChar,
      OrderStatus.PENDING_PAYMENT
    );
    findRequest.input('CutoffTime', sql.DateTime2, cutoffTime);

    const overdueOrdersResult = await findRequest.query(`
            SELECT OrderID, PromotionID
            FROM Orders
            WHERE OrderStatus = @PendingStatus AND OrderDate < @CutoffTime;
        `);

    const ordersToCancel = overdueOrdersResult.recordset;

    if (ordersToCancel.length > 0) {
      const orderIdsToCancel = ordersToCancel.map((o) => o.OrderID);

      const orderIdPlaceholders = orderIdsToCancel
        .map((_, index) => `@orderIdCancel${index}`)
        .join(',');
      const cancelUpdateRequest = transaction.request();
      cancelUpdateRequest.input(
        'CancelledStatus',
        sql.VarChar,
        OrderStatus.CANCELLED
      );
      orderIdsToCancel.forEach((id, index) =>
        cancelUpdateRequest.input(`orderIdCancel${index}`, sql.BigInt, id)
      );

      const updateResult = await cancelUpdateRequest.query(`
            UPDATE Orders
            SET OrderStatus = @CancelledStatus
            WHERE OrderID IN (${orderIdPlaceholders});
        `);
      logger.info(
        `[CRON_JOB] Cancelled ${updateResult.rowsAffected[0]} overdue pending orders: IDs ${orderIdsToCancel.join(', ')}.`
      );

      for (const order of ordersToCancel) {
        if (order.PromotionID) {
          const reverted = await promotionRepository.decrementUsageCount(
            order.PromotionID,
            transaction
          );
          if (reverted) {
            logger.info(
              `[CRON_JOB] Reverted usage count for PromotionID ${order.PromotionID} from cancelled OrderID ${order.OrderID}.`
            );
          } else {
            logger.warn(
              `[CRON_JOB] Could not revert usage count for PromotionID ${order.PromotionID} (Order ${order.OrderID}), possibly already 0 or limit issue.`
            );
          }
        }
      }
    } else {
      logger.info('[CRON_JOB] No overdue pending orders found to cancel.');
    }

    await transaction.commit();
    committed = true;
  } catch (error) {
    logger.error('[CRON_JOB] Error cancelling overdue pending orders:', error);
    // [SỬA] Guard cũ dựa vào transaction.active / transaction.rolledBack —
    // mssql 11 KHÔNG có hai thuộc tính này (cả hai luôn undefined), nên guard
    // là mã chết: một chiều thì rollback không bao giờ chạy, chiều kia thì
    // rollback bị bỏ qua. Cả hai đều để lại transaction mở và rò kết nối khỏi
    // pool (tối đa 10 kết nối).
    if (!committed) {
      try {
        await transaction.rollback();
        logger.info('[CRON_JOB] Transaction rolled back due to error.');
      } catch (rbError) {
        logger.error('[CRON_JOB] Rollback failed:', rbError);
      }
    }
  }
};

/**
 * Lên lịch chạy cron job.
 */
const schedulePendingOrderCancellation = () => {
  const cronSchedule =
    process.env.CANCEL_PENDING_ORDERS_CRON_SCHEDULE || '*/30 * * * *';
  if (cron.validate(cronSchedule)) {
    cron.schedule(cronSchedule, () => {
      logger.info(
        `[CRON_JOB] Triggering cancelOverduePendingOrders job with schedule: ${cronSchedule}`
      );
      cancelOverduePendingOrders().catch((err) => {
        logger.error(
          '[CRON_JOB] Unhandled error in scheduled pending order cancellation:',
          err
        );
      });
    });
    logger.info(
      `[CRON_JOB] Scheduled job for cancelling overdue pending orders with schedule: ${cronSchedule}. Timeout: ${PENDING_ORDER_TIMEOUT_MINUTES} minutes.`
    );
  } else {
    logger.error(
      `[CRON_JOB] Invalid cron schedule: ${cronSchedule}. Job not scheduled.`
    );
  }
};

module.exports = {
  cancelOverduePendingOrders,
  schedulePendingOrderCancellation,
};

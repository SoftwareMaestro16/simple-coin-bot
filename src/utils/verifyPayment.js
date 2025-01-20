const { checkPaymentInBlockchain } = require('../utils/checkPayment');
const { activateSubscription, getUserById, resetPaymentTrackingCode } = require('../db');

async function verifyPayment(bot, chatId, userId) {
    const user = await getUserById(userId);

    if (!user || !user.connectedWallet || !user.paymentTrackingCode) {
        await bot.sendMessage(chatId, '❌ Нет данных для проверки. Пожалуйста, создайте новый код.');
        return false;
    }

    const isPaid = await checkPaymentInBlockchain(user.address, user.paymentTrackingCode);

    if (isPaid) {
        try {
            const durationMinutes = 2; // 30 дней в минутах 30 * 24 * 60
            console.log('Activating subscription with durationMinutes:', durationMinutes);

            await activateSubscription(userId, durationMinutes);

            await resetPaymentTrackingCode(userId);

            await bot.sendMessage(
                chatId,
                `✅ Оплата подтверждена! Подписка активна на ${durationMinutes / (24 * 60)} дней.`
            );
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении подписки:', error);
            await bot.sendMessage(chatId, 'Произошла ошибка при обновлении подписки.');
            return false;
        }
    }

    return false;
}

async function startPaymentVerification(bot, chatId, userId) {
  console.log(`Запуск отслеживания платежа для пользователя: ${userId}`);

  let isPaymentConfirmed = false; 

  const interval = setInterval(async () => {
    console.log(`[${new Date().toISOString()}] Проверка платежа для пользователя: ${userId}`);

    const user = await getUserById(userId);
    if (!user || !user.paymentTrackingCode) {
      console.log(`Пользователь ${userId} не имеет кода отслеживания или был удален. Остановка проверки.`);
      clearInterval(interval);
      return;
    }

    try {
      isPaymentConfirmed = await verifyPayment(bot, chatId, userId);
      if (isPaymentConfirmed) {
        console.log(`Платеж для пользователя ${userId} подтвержден. Остановка проверки.`);
        clearInterval(interval); 
      } else {
        console.log(`Платеж для пользователя ${userId} пока не найден. Продолжаем отслеживание.`);
      }
    } catch (error) {
      console.error(`Ошибка при проверке платежа для пользователя ${userId}:`, error);
      clearInterval(interval);
    }
  }, 15000); 

  setTimeout(async () => {
    if (!isPaymentConfirmed) {
      console.log(`Время отслеживания истекло для пользователя: ${userId}. Удаляем трекинг-код.`);
      await resetPaymentTrackingCode(userId); 
      await bot.sendMessage(chatId, '⏳ Время оплаты истекло. Создайте новый код отслеживания для повторной попытки.');
    }
    clearInterval(interval); 
  }, 300000); 
}

module.exports = {
  verifyPayment,
  startPaymentVerification,
};
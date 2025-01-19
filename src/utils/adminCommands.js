const adminCommands = [
    {
      command: '/show_users',
      description: 'Показать список пользователей в базе данных.',
    },
    {
      command: '/count_users',
      description: 'Показать количество пользователей в базе данных.',
    },
    {
      command: '/set_collector_address',
      description: 'Установить адрес сборщика токенов.',
    },
    {
      command: '/set_monthly_tokens',
      description: 'Установить количество токенов для ежемесячной оплаты.',
    },
    {
      command: '/get_payment_info',
      description: 'Показать текущие настройки сборщика токенов и ежемесячной оплаты.',
    },
];

module.exports = {
    adminCommands
}
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
        command: '/set_public_tokens',
        description: 'Установить количество токенов для публичного чата.',
    },
    {
      command: '/set_monthly_tokens',
      description: 'Установить количество токенов для ежемесячной оплаты.',
    },
    {
        command: '/set_whale_tokens',
        description: 'Установить количество токенов для чата китов.',
    },
    {
      command: '/get_payment_info',
      description: 'Показать текущие настройки сборщика токенов и ежемесячной оплаты.',
    },
];

module.exports = {
    adminCommands
}
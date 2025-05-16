function getWeekRange(date) {
    // Garantir que estamos trabalhando com uma data válida
    let currentDate;
    
    // Se a data for uma string, converter para Date
    if (typeof date === 'string') {
        currentDate = new Date(date + 'T12:00:00');
    } else if (date instanceof Date) {
        currentDate = new Date(date.getTime());
    } else {
        currentDate = new Date();
    }
    
    // Se a data for inválida, lançar erro
    if (isNaN(currentDate.getTime())) {
        console.error('Data inválida recebida:', date);
        throw new Error('Data inválida fornecida para getWeekRange');
    }

    // Obter o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const currentDay = currentDate.getDay();
    
    // Calcular a data da segunda-feira
    const monday = new Date(currentDate);
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(currentDate.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);

    // Calcular a data do domingo (5 dias após a segunda)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 5);
    sunday.setHours(23, 59, 59, 999);

    // Log para debug
    console.log({
        dataOriginal: date,
        diaDaSemana: currentDay,
        diasSubtraidos: daysToSubtract,
        segunda: monday.toISOString(),
        domingo: sunday.toISOString(),
        diasEntreDatas: (sunday.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)
    });

    return {
        inicio: monday,
        fim: sunday
    };
}

function formatDateRange(inicio, fim) {
    const formatDate = (date) => {
        const dataLocal = new Date(date);
        // Ajustar para UTC para evitar problemas com fuso horário
        dataLocal.setMinutes(dataLocal.getMinutes() + dataLocal.getTimezoneOffset());
        
        return dataLocal.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return `${formatDate(inicio)} - ${formatDate(fim)}`;
}

module.exports = {
    getWeekRange,
    formatDateRange
}; 
// Função para confirmar exclusão
function confirmarExclusao(event) {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
        event.preventDefault();
    }
}

// Adiciona o listener de confirmação a todos os botões de exclusão
document.addEventListener('DOMContentLoaded', function() {
    const deleteButtons = document.querySelectorAll('button[type="submit"]');
    deleteButtons.forEach(button => {
        if (button.textContent.trim().toLowerCase().includes('remover')) {
            button.addEventListener('click', confirmarExclusao);
        }
    });

    // Destaca estudantes que participaram na última semana
    const selects = document.querySelectorAll('select[name*="estudante"]');
    selects.forEach(select => {
        const options = select.querySelectorAll('option[data-ultima-semana="true"]');
        options.forEach(option => {
            option.style.color = '#dc3545';
            option.style.fontStyle = 'italic';
        });
    });

    // Atualiza a data da semana para a próxima segunda-feira ao criar nova designação
    const semanaInput = document.querySelector('input[name="semana"]');
    if (semanaInput && !semanaInput.value) {
        const hoje = new Date();
        const proximaSegunda = new Date(hoje);
        proximaSegunda.setDate(hoje.getDate() + ((1 + 7 - hoje.getDay()) % 7));
        semanaInput.value = proximaSegunda.toISOString().split('T')[0];
    }
}); 
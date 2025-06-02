// Função para obter parâmetros do Saque‐Aniversário conforme faixas oficiais
function getSaqueAniversarioParams(saldo) {
    if (saldo <= 500.00) {
      return { perc: 0.50, adicional: 50.00 };
    } else if (saldo <= 1000.00) {
      return { perc: 0.40, adicional: 150.00 };
    } else if (saldo <= 5000.00) {
      return { perc: 0.30, adicional: 650.00 };
    } else if (saldo <= 10000.00) {
      return { perc: 0.20, adicional: 1150.00 };
    } else if (saldo <= 15000.00) {
      return { perc: 0.15, adicional: 1900.00 };
    } else if (saldo <= 20000.00) {
      return { perc: 0.10, adicional: 2650.00 };
    } else {
      return { perc: 0.05, adicional: 4500.00 };
    }
  }
  
  function runSimulation() {
    // 1. Captura valores do formulário
    const salary = parseFloat(document.getElementById('salary').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value, 10);
    const initialBalanceFGTS = parseFloat(document.getElementById('initialBalanceFGTS').value);
  
    const personalType = document.querySelector('input[name="personalType"]:checked').value;
    let personalReturnInput = parseFloat(document.getElementById('personalReturn').value);
    let monthlyRatePersonal;
    if (personalType === 'anual') {
      // Converte taxa anual em mensal equivalente
      monthlyRatePersonal = Math.pow(1 + personalReturnInput / 100, 1 / 12) - 1;
    } else {
      monthlyRatePersonal = personalReturnInput / 100;
    }
  
    const trFgtsInput = parseFloat(document.getElementById('trFgts').value);
    // FGTS rende 3% a.a. + TR mensal:
    const monthlyRateFGTS = (Math.pow(1 + 0.03, 1 / 12) - 1) + (trFgtsInput / 100);
  
    // 2. Validações
    if (
      isNaN(salary) ||
      isNaN(birthMonth) ||
      isNaN(initialBalanceFGTS) ||
      isNaN(personalReturnInput) ||
      isNaN(trFgtsInput)
    ) {
      alert('Preencha todos os campos corretamente.');
      return;
    }
    if (birthMonth < 1 || birthMonth > 12) {
      alert('Escolha um mês de aniversário entre 1 e 12.');
      return;
    }
  
    // 3. Vamos pegar o mês atual para que "mês 1" da simulação seja o mês real de abertura do site
    const hoje = new Date();
    const startMonth = hoje.getMonth() + 1; // 1 a 12
  
    // 4. Configurações da simulação mensal
    const totalMonths = 30 * 12; // 30 anos → 360 meses
    const depositMonthly = salary * 0.08; // 8% do salário depositado todo mês
  
    // Cenário A: Saque‐Aniversário
    let balanceFGTSA = initialBalanceFGTS;
    let investPersonal = 0.0;
    const tableA = []; // { mes, balanceStart, interest, deposit, balanceBeforeWithdraw, withdraw, balanceAfterWithdraw, investAccum }
  
    // Cenário B: Demissão sem justa causa
    let balanceFGTSB = initialBalanceFGTS;
    const tableB = []; // { mes, balanceStart, interest, deposit, balanceEnd, valueIfDismissed }
  
    // 5. Loop de projeção mês a mês
    for (let m = 1; m <= totalMonths; m++) {
      // Calcula qual é o “mês calendário” correspondente a este m
      // Ex.: se startMonth = 6 (junho), então m=1 → mêsCorrente = 6; m=2 → mêsCorrente = 7; ...; m=7 → mêsCorrente = 12; m=8 → mêsCorrente = 1 (janeiro do próximo ano)
      const mêsCorrente = ((startMonth - 1 + (m - 1)) % 12) + 1;
  
      // --- Cenário A – Saque‐Aniversário ---
      const saldoAntesA = balanceFGTSA;
      const jurosA = saldoAntesA * monthlyRateFGTS;
      let saldoAtualizadoA = saldoAntesA + jurosA + depositMonthly;
  
      let valorSaque = 0;
      if (mêsCorrente === birthMonth) {
        // Se for mês de aniversário, calcula o saque conforme faixas oficiais
        const { perc, adicional } = getSaqueAniversarioParams(saldoAtualizadoA);
        valorSaque = saldoAtualizadoA * perc + adicional;
        if (valorSaque > saldoAtualizadoA) {
          valorSaque = saldoAtualizadoA;
        }
      }
      const saldoAposSaque = saldoAtualizadoA - valorSaque;
      investPersonal = investPersonal * (1 + monthlyRatePersonal) + valorSaque;
  
      tableA.push({
        mes: m,
        mêsCorrente: mêsCorrente,
        balanceStart: saldoAntesA,
        interest: jurosA,
        deposit: depositMonthly,
        balanceBeforeWithdraw: saldoAtualizadoA,
        withdraw: valorSaque,
        balanceAfterWithdraw: saldoAposSaque,
        investAccum: investPersonal
      });
  
      balanceFGTSA = saldoAposSaque;
  
      // --- Cenário B – Demissão sem justa causa ---
      const saldoAntesB = balanceFGTSB;
      const jurosB = saldoAntesB * monthlyRateFGTS;
      let saldoAtualizadoB = saldoAntesB + jurosB + depositMonthly;
      const valorSeDemitido = saldoAtualizadoB * 1.4;
  
      tableB.push({
        mes: m,
        mêsCorrente: mêsCorrente,
        balanceStart: saldoAntesB,
        interest: jurosB,
        deposit: depositMonthly,
        balanceEnd: saldoAtualizadoB,
        valueIfDismissed: valorSeDemitido
      });
  
      balanceFGTSB = saldoAtualizadoB;
    }
  
    // 6. Montar HTML das tabelas
    let html = '<div class="container-tabelas">';
  
    // Tabela Cenário A (Saque‐Aniversário)
    html += `
      <div class="tabela-wrapper">
        <h2>Projeção Mensal – Saque‐Aniversário</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Saldo Início<br>(R$)</th>
              <th>Juros FGTS<br>(R$)</th>
              <th>Depósito<br>(R$)</th>
              <th>Antes do Saque<br>(R$)</th>
              <th>Saque<br>(R$)</th>
              <th>Pós‐Saque<br>(R$)</th>
              <th>Inv. Pessoal<br>(R$)</th>
            </tr>
          </thead>
          <tbody>
    `;
    tableA.forEach(row => {
      html += `
        <tr>
          <td>${row.mes}</td>
          <td>${row.balanceStart.toFixed(2)}</td>
          <td>${row.interest.toFixed(2)}</td>
          <td>${row.deposit.toFixed(2)}</td>
          <td>${row.balanceBeforeWithdraw.toFixed(2)}</td>
          <td>${row.withdraw.toFixed(2)}</td>
          <td>${row.balanceAfterWithdraw.toFixed(2)}</td>
          <td>${row.investAccum.toFixed(2)}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  
    // Tabela Cenário B (Demissão sem justa causa)
    html += `
      <div class="tabela-wrapper">
        <h2>Projeção Mensal – Demissão sem Justa Causa</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Saldo Início<br>(R$)</th>
              <th>Juros FGTS<br>(R$)</th>
              <th>Depósito<br>(R$)</th>
              <th>Saldo Final<br>(R$)</th>
              <th>Valor se Demitido<br>(R$)</th>
            </tr>
          </thead>
          <tbody>
    `;
    tableB.forEach(row => {
      html += `
        <tr>
          <td>${row.mes}</td>
          <td>${row.balanceStart.toFixed(2)}</td>
          <td>${row.interest.toFixed(2)}</td>
          <td>${row.deposit.toFixed(2)}</td>
          <td>${row.balanceEnd.toFixed(2)}</td>
          <td>${row.valueIfDismissed.toFixed(2)}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </div>
    `;
  
    html += '</div>'; // fecha container-tabelas
  
    // 7. Encontrar “break-even” em meses
    let breakMonth = null;
    for (let i = 0; i < tableA.length; i++) {
      const valorInvestA = tableA[i].investAccum;
      const valorDemB = tableB[i].valueIfDismissed;
      if (valorInvestA >= valorDemB) {
        breakMonth = i + 1;
        break;
      }
    }
  
    html += '<div class="mensagem">';
    if (breakMonth !== null) {
      html += `→ Após aproximadamente <strong>${breakMonth}</strong> meses de trabalho, reinvestir seus saques (Saque‐Aniversário) ultrapassa o valor que teria ao ser demitido sem justa causa neste mesmo mês.`;
    } else {
      html += `→ Em até 30 anos (360 meses), o Saque‐Aniversário (reinvestindo) não alcança o valor do FGTS + 40% de multa.`;
    }
    html += '</div>';
  
    // 8. Exibe tudo
    document.getElementById('resultados').innerHTML = html;
  }
  
  // Associa botão ao evento
  document.getElementById('btnCalcular').addEventListener('click', runSimulation);
  
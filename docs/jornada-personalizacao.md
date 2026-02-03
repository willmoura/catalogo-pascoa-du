# Jornada de Personalização - Ovos de Páscoa Du

## Visão Geral

O cliente poderá criar seu próprio ovo de Páscoa personalizado através de um fluxo guiado de 3 etapas, com visualização em tempo real e resumo final antes de enviar o pedido via WhatsApp.

---

## Fluxo de Escolhas

### Etapa 1: Peso do Ovo
O cliente escolhe o peso desejado para seu ovo personalizado.

| Peso | Preço |
|------|-------|
| 400g | R$ 99,90 |
| 600g | R$ 149,90 |
| 800g | R$ 189,90 |

**Interação**: Cards visuais com ícones de tamanho comparativo

---

### Etapa 2: Tipo de Casca
O cliente escolhe o tipo de chocolate para a casca do ovo.

| Tipo de Casca | Descrição |
|---------------|-----------|
| Ao Leite | Chocolate ao leite cremoso |
| Branco | Chocolate branco suave |
| Meio Amargo | 50% cacau, equilibrado |

**Interação**: Botões com cores representativas de cada chocolate

---

### Etapa 3: Recheio
O cliente escolhe o recheio que irá dentro do ovo. Todos os sabores da Linha Trufada Gourmet estão disponíveis:

| Sabores Disponíveis |
|---------------------|
| Franuí |
| Kinder Bueno |
| Ferrero Rocher |
| Ninho com Nutella |
| Maracujá com Nutella |
| Maracujá |
| Ovomaltine |
| Strogonoff de Nozes |
| Alpino |
| Doce de Leite |
| Prestígio |
| Sensação |
| Charge |
| Trufa Tradicional |

**Interação**: Grid de sabores com seleção visual

---

## Tela de Resumo

Após completar as 3 etapas, o cliente visualiza:

1. **Resumo visual** do ovo personalizado
2. **Detalhamento das escolhas**:
   - Peso selecionado
   - Tipo de casca
   - Recheio escolhido
3. **Preço total**
4. **Campo para observações** (mensagem especial, alergias, etc.)
5. **Botão "Finalizar via WhatsApp"**

---

## Mensagem WhatsApp (Exemplo)

```
*PEDIDO PERSONALIZADO - OVOS DE PÁSCOA DU*

*Meu Ovo Personalizado*

• Peso: 600g
• Casca: Chocolate Meio Amargo
• Recheio: Ferrero Rocher

━━━━━━━━━━━━━━━━━━
*TOTAL: R$ 149,90*
━━━━━━━━━━━━━━━━━━

Observações: Presente para aniversário

Olá! Gostaria de fazer este pedido personalizado.
```

---

## Interface Proposta

### Layout Mobile-First

```
┌─────────────────────────────┐
│  ← Monte seu Ovo      1/3   │
├─────────────────────────────┤
│                             │
│    [Visualização do Ovo]    │
│         (Preview)           │
│                             │
├─────────────────────────────┤
│  Escolha o Peso             │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │400g │ │600g │ │800g │   │
│  │99,90│ │149,9│ │189,9│   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
├─────────────────────────────┤
│  [Próximo →]                │
└─────────────────────────────┘
```

### Elementos de UX

- **Barra de progresso** indicando etapa atual (1/3, 2/3, 3/3)
- **Botão voltar** para revisar escolhas anteriores
- **Preview dinâmico** que atualiza conforme as escolhas
- **Preço atualizado em tempo real** no rodapé
- **Animações suaves** entre etapas (Framer Motion)
- **Validação** para garantir que todas as etapas foram completadas

---

## Acesso à Funcionalidade

O cliente pode acessar a personalização através de:

1. **Botão destacado no Hero**: "Monte seu Ovo"
2. **Categoria especial**: "Personalize" nas categorias
3. **Card especial** na grid de produtos

---

*Proposta aprovada - Iniciando implementação.*

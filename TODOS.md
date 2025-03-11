## TODOS

- Separar icones usados
-
- Concentração
- Filtros
- Rolar a partir do card
- Botão Criar Caracteristicas e Habilidades
- Tooltip-Embed / Summary - Na lista de Ações

## EFFECTS v2

```json
{
  "type": "base", // base, item, modification
  "system": {
    "applyMode": "manual",
    "#APPLYMODES": {
      "actor": "", // Is applied to parent/granparent actor,
      "item": "", // Is applied to parent item,
      "target-actor": "", // Is copied/applied to other documents through messages
      "target-item": ""
    },
    "transferMode": "manual",
    "#TRANSFERMODES": {
      "manual": "",
      "passive": "", // AFFECTS THE PARENT DOCUMENT
      "use": "",
      // manual, passive,
      // CORE SUSGESTION
      "manual": "", // OR BLANK
      "actor": "", // transfer to parent/granparent actor
      "item": "" // tranfer to parent item
    }
  }
}
```

/**
 * ACTIVEEFFECT.change
 * - key: roll.TYPE.ROLLTERM?.SOURCE?[FLAVOR]
 * @param {String} [TYPE = {roll|check|ability|str|skill|insi|attack|initiative|deathsave|hitdie|hitdielevel|damage}]
 * @param {String} [ROLLTERM = {ALL|DIE|NUMERIC|FIRST|ONCE|ONCEDIE|ONCENUMERIC}]
 * @param {String} [SOURCE = {ITEMNAME|MODIFICATIONNAME}]
 * @param {String} [FLAVOR = {fire}]
 * - key 
 * 
 * DATAFIELD.rollBonuses
 */
/**
 * OPTION A:
 *  OVERWRITE TERMS TO ADD EACH _APPLYMODE()
 * OPTION B:
 *  CREATE A DATAFIELD FOR ROLL MODIFIERS
 *  CREATE A DATAFIElD FOR ROLLTERMS
 * 
 */

/**
 * CAÇADOR
 * MARCA DA PRESA: +1d4 dano
 * @value = @MarcaDaPresa * @Inimigo
 * @key = roll | @value = 1 * @$ * @Inimigo
 * ESPREITAR: +1 Perícia vs Marcado (Aumenta com os PM Gasto na MdP)
 * PONTO FRACO: +2 margem de ameaça vs Inimigo Marcado
 * INIMIGO DE: Dobra os dados de Marca da Presa, Bõnus de Espreitar e Ponto Fraco se for do tipo certo.
 * OLHO DO FALCÃO: Muda alcance da MdP.
 * MESTRE CAÇADOR: Muda ação da MdP Auto. Nova Modificação da +2 margem de ameaça
 * MdP
 */

/**
 * Data schema, attributes, and methods specific to Modification type ActiveEffects.
 */

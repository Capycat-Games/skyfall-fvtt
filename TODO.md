# VARIAVEIS EM INGLÊS
PROS
- Internacionalização. Caso haja planos pra lançar Skyfall em inglês
- - Pode atrair público gringo
- - Pode facilitar pra desenvolvedores gringos colaborem com o projeto do sistema, fazendo alguma atualização
- - Pode facilitar pra desenvolvedores de módulos modifiquem seus módulos pra deixar compativel com Skyfall

CONTRAS
- Pode dificultar pra jogadores e mestres customizarem/automatizarem suas ideias.


# TODOS
HABILIDADES
- CAMPOS CONDICIONAIS

# DUVIDAS

# Dúvidas sobre Redução, Resistência, Vulnerabilidade, Imunidade
Q: Posso considerar que modificadores de dano funcionam como uma progressão (Vulnerabilidade -> Normal -> Resistência -> Imunidade)?
Efeitos sempre pioram/melhoram/mudam certo? Nunca adicionam

Ou podem co-existir, ex.: uma criatura tem Resistencia a dano Ígnio, e recebe um efeito que concede Vulnerabilidade a dano Ígnio

system.modificadores.dano.igneo | melhorar | 1         : (normal => resitencia)
system.modificadores.dano.igneo.resistencia | melhorar | imune     : (normal => resitencia)
system.modificadores.dano.igneo |  piorar  | 1         : ()
system.modificadores.dano.igneo | sobrepor | imune     : 
system.modificadores.dano.igneo | sobrepor | imune     : 


danoRecebido( igeno, resistencia ) | custom | imune      : 

Vitae em Arma
danoCausado( reducao ) | custom | 0
danoCausado( * , imunidade ) | custom | resistencia

Mestre do Elemento
danoRecebido( @elemento ) | custom | imunidade

Canalizar Divindade
danoCausado( igneo , imunidade ) | custom | 0
danoCausado( igneo , resistencia ) | custom | 0

Aríete Arcano - FRIO
danoRecebido( * , resistencia ) | custom | normal
danoRecebido( * , imunidade ) | custom | resistencia

Elo do Destino de Taliyesin 1PC [ADICIONA]
danoRecebido( * , resistencia ) | custom | imunidade

Silêncio Sepulcral Efeito
danoRecebido( trovejante ) | custom | imunidade

# Dúvidas sobre DESCRITORES
Q: Descritores podem ter mais de um tipo? Contundente, Cortante e Perfurante aparecem sob Descritores de Equipamento e Dano, enquanto Inspiração aparece sob Categoria e Diverso

Q: Todo descritor terá uma descrição?

# Dúvidas sobre ITENS

Q: Quais são os itens consumíveis? Poção, Munição. Granadas e Elixires são habilidades certo?

# Dúvidas sobre SIGILOS

Q: Em um lugar fala que um item pode ter 2 sigilos - sufixo e prefixo. Outro Fala que pode ter até 4.


# Dúvidas sobre BÔNUS
Q: Existem bônus em 
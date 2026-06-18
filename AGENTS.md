<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Identidade Visual e Diretrizes de Design - Central Azul

As seguintes informacoes de design devem ser seguidas para todo o projeto:

- **Abordagem**: Desenvolvido pensando em mobile first.
- **Paleta de Cores**:
  - Principal: #E9E9E9 (Cinza claro / off-white)
  - Secundaria: #105D8F (Azul profundo)
  - Terciaria: #262626 (Cinza escuro)
  - Extras: #5C4C44 (Marrom acinzentado quente), #604F45 (Marrom escuro), #CC9F6F (Bronze / dourado suave)

# Diretrizes de UX e Comportamento Visual

- **Animacoes Suaves**: Evitar efeitos bruscos ou trepidacoes. Usar transicoes lineares ou suavizadas do tipo tween (duracao em torno de 0.2s) em vez de fisicas de mola instaveis que causam oscilacoes de pixels.
- **Aceleracao por Hardware**: Aplicar transform-gpu e classes de aceleracao nativa em elementos com animacoes de largura ou posicionamento para evitar travamentos visuais.
- **Navegacao Fluida**: A barra lateral deve abrir automaticamente sob efeito de hover (ao passar o mouse) e colapsar ao sair, mantendo o alinhamento centralizado do avatar do usuario sem cortar as bordas quando recolhido.

# Preferencias e Regras do Projeto

- **Sem Emojis**: Nao utilizar emojis em titulos, avisos, botoes ou textos da interface.
- **Sem Travessoes Longos**: Evitar o uso do caractere de travessao longo (em-dash). Utilizar hifens comuns ou parenteses para separacoes de sentencas.
- **Termos Tecnicos Ocultos**: Termos de infraestrutura interna como Backblaze, B2, S3 ou similares nunca devem ser exibidos na interface visual para o usuario. Substituir por termos de uso comum, como Drive de Arquivos ou Armazenamento local.

# Comportamento das Funcionalidades

## 1. Drive de Arquivos & Midias

Unifica a listagem de arquivos enviados localmente e links cadastrados de forma visualmente identica, diferenciando-os por icones e rotulos contextuais.

- **Arquivos Grandes**: A interface deve avisar de forma clara que arquivos grandes, videos ou mídias pesadas devem ser vinculados via links externos para poupar espaco (ex: Google Drive, SharePoint e YouTube).
- **Limite Visivel**: Avisar o usuario sobre o limite maximo de 10 GB para uploads locais.
- **Seguranca por Hierarquia**: O campo para definir o nivel de acesso minimo de um novo documento so deve estar visivel para usuarios nivel 1 (Direcao Geral / Admin).

## 2. Controle de Cargos & Seguranca

- **Cargos Customizados**: Permitir que contas de Nível 1 criem, editem, mudem o nome e excluam cargos dinamicamente atraves de uma interface dedicada em tempo real.
- **Resiliencia de Exclusao**: Se um cargo for deletado, a interface e o sistema devem automaticamente migrar os usuarios afetados para o cargo base (VIEWER) para nao gerar falhas de permissao ou travamento de telas.
- **Sincronizacao de Niveis**: Ao selecionar um cargo para um colaborador na tabela de contas, a interface deve sugerir e ajustar automaticamente o nivel de hierarquia correspondente configurado para aquele cargo.

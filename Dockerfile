# Steg 1: "Byggeren"
# Bruker et fullt Node.js-image for å installere avhengigheter.
FROM node:18-alpine as builder
LABEL stage="builder"
WORKDIR /app

# Kopierer package.json først for å utnytte Docker-caching.
# Dette laget bygges kun på nytt hvis disse filene endres.
COPY package*.json ./
RUN npm install

# Kopierer resten av kildekoden.
COPY . .

# ---

# Steg 2: Det endelige produksjons-imaget
# Starter fra et minimalt base-image for lavere størrelse og mindre angrepsflate.
FROM node:18-alpine
WORKDIR /app

# Oppretter en dedikert, ikke-root bruker for sikkerhet.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Kopierer kun de nødvendige filene fra "byggeren".
# Dette ekskluderer utviklingsavhengigheter og unødvendige kildekoder.
COPY --from=builder --chown=appuser:appgroup /app .

# Dokumenterer porten applikasjonen vil lytte på.
EXPOSE 3000

# Definerer kommandoen for å kjøre applikasjonen.
CMD ["node", "src/index.js"]

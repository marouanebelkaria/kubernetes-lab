# Rapport Phase 1 — Construction d'images Docker
## Formation Kubernetes K3s — Marouane Belkaria
## Date : 20 Juillet 2026

---

## 1. Comparatif des images

| Image          | Base                              | Taille  | Reduction |
|----------------|-----------------------------------|---------|-----------|
| lab-api:naive  | node:20                           | 1.59 Go | reference |
| lab-api:v1.0.0 | distroless/nodejs20-debian12:nonroot | 177 Mo  | -89%   |

**Conclusion :** Le multi-stage build combiné à l'image distroless permet
une réduction de 89% de la taille de l'image.

---

## 2. Scan de sécurité Trivy

### 2.1 Image naive (lab-api:naive)

Librairies système affectées (CRITICAL / HIGH) :

| Librairie      | CVE            | Severite | Statut       |
|----------------|----------------|----------|--------------|
| gcc-12         | CVE-2022-27943 | HIGH     | fix_deferred |
| libaom3        | CVE-2023-6879  | CRITICAL | fix_deferred |
| libgcc-s1      | CVE-2022-27943 | HIGH     | fix_deferred |
| libssl3        | CVE-2026-31789 | CRITICAL | fixed        |
| libssl3        | CVE-2026-28387 | HIGH     | fixed        |
| libssl3        | CVE-2026-28388 | HIGH     | fixed        |
| libssl3        | CVE-2026-28389 | HIGH     | fixed        |
| libssl3        | CVE-2026-28390 | HIGH     | fixed        |
| libssl3        | CVE-2026-45447 | HIGH     | fixed        |
| libstdc++6     | CVE-2022-27943 | HIGH     | fix_deferred |
| openssh-client | CVE-2026-60002 | CRITICAL | fix_deferred |
| openssh-client | CVE-2026-35385 | HIGH     | fixed        |
| openssh-client | CVE-2026-35386 | HIGH     | fixed        |
| openssh-client | CVE-2026-35414 | HIGH     | fixed        |
| openssl        | CVE-2026-45447 | HIGH     | fixed        |
| perl           | CVE-2026-13221 | CRITICAL | affected     |
| perl           | CVE-2026-42496 | CRITICAL | fix_deferred |
| perl           | CVE-2026-8376  | CRITICAL | affected     |
| python3.11     | CVE-2025-13836 | HIGH     | fixed        |
| zlib1g         | CVE-2023-45853 | CRITICAL | will_not_fix |

Librairies Node.js affectées (HIGH) :
- body-parser : CVE-2024-45590
- cross-spawn : CVE-2024-21538
- glob : CVE-2025-64756
- minimatch : CVE-2026-26996, CVE-2026-27903, CVE-2026-27904
- path-to-regexp : CVE-2024-45296, CVE-2024-52798, CVE-2026-4867
- sigstore : CVE-2026-48815
- tar : CVE-2026-23745, CVE-2026-23950, CVE-2026-24842, CVE-2026-26960

Rapport brut complet : docs/trivy-raw-naive.txt

---

### 2.2 Image production (lab-api:v1.0.0)

Librairies système affectées (CRITICAL / HIGH) :

| Librairie | CVE            | Severite | Statut | Fix disponible       |
|-----------|----------------|----------|--------|----------------------|
| libssl3   | CVE-2026-31789 | CRITICAL | fixed  | 3.0.19-1~deb12u2     |
| libssl3   | CVE-2026-28387 | HIGH     | fixed  | 3.0.19-1~deb12u2     |
| libssl3   | CVE-2026-28388 | HIGH     | fixed  | 3.0.19-1~deb12u2     |
| libssl3   | CVE-2026-28389 | HIGH     | fixed  | 3.0.19-1~deb12u2     |
| libssl3   | CVE-2026-28390 | HIGH     | fixed  | 3.0.19-1~deb12u2     |
| libssl3   | CVE-2026-45447 | HIGH     | fixed  | 3.0.20-1~deb12u2     |

Librairies Node.js affectées (HIGH) :
- body-parser : CVE-2024-45590 (fix : 1.20.3)
- path-to-regexp : CVE-2024-45296, CVE-2024-52798, CVE-2026-4867

**Plan de remediation :**
- libssl3 : CVE liée à l'image de base distroless debian12.
  Le correctif est disponible (3.0.19) mais pas encore intégré
  dans l'image distroless par Google.
  Action : surveiller les mises à jour de gcr.io/distroless/nodejs20-debian12
  et rebuilder l'image dès qu'une version corrigée est disponible.
- body-parser et path-to-regexp : mettre à jour express vers une
  version récente qui embarque les versions corrigées de ces dépendances.

Rapport brut complet : docs/trivy-raw-v1.0.0.txt

---

## 3. Linting Hadolint

Commande exécutée :
```
hadolint --config .hadolint.yaml phase1-docker/app/Dockerfile
```

**Résultat : 0 warning, 0 erreur**

Corrections appliquées durant le développement :
- DL3006 : image distroless sans tag explicite → corrigé en :nonroot
- DL3007 : tag :latest utilisé → corrigé en :nonroot
- Suppression de `RUN apk update && apk upgrade` (DL3009)

Rapport brut : docs/hadolint-raw.txt

---

## 4. Analyse des layers (dive)

### 4.1 Image naive (lab-api:naive)

| Metrique              | Valeur    |
|-----------------------|-----------|
| Efficacite            | 99.3825%  |
| Donnees gaspillees    | 8.6 Mo    |
| userWastedPercent     | 0.8717%   |
| Resultat CI           | PASS      |

Principaux fichiers dupliques entre layers :
- /var/cache/debconf/templates.dat : 3.2 Mo (duplique 4 fois)
- /var/cache/debconf/templates.dat-old : 3.1 Mo (duplique 4 fois)
- /var/lib/dpkg/status : 740 ko (duplique 4 fois)
- /app/package-lock.json : 95 ko (duplique 2 fois)

### 4.2 Image production (lab-api:v1.0.0)

| Metrique              | Valeur    |
|-----------------------|-----------|
| Efficacite            | 99.9997%  |
| Donnees gaspillees    | 613 octets|
| userWastedPercent     | 0.0005%   |
| Resultat CI           | PASS      |

Seul fichier duplique :
- /usr/lib/os-release : 613 octets (fichier systeme inévitable)

**Conclusion :** Le multi-stage build élimine quasiment tout gaspillage.
Le stage RUNNER repart d'une image vierge sans historique de layers.
Gain d'efficacité : de 99.38% à 99.9997%.

Rapports bruts : docs/dive-raw-naive.txt et docs/dive-raw-v1.0.0.txt

---

## 5. Bonnes pratiques appliquées

| Critere                        | Statut | Detail                               |
|--------------------------------|--------|--------------------------------------|
| Image de base avec tag precis  | OK     | node:20-alpine / distroless:nonroot  |
| Multi-stage build              | OK     | Stage builder + stage runner         |
| Image distroless en runtime    | OK     | gcr.io/distroless/nodejs20-debian12  |
| Utilisateur non-root           | OK     | USER nonroot                         |
| Aucun secret dans les layers   | OK     | Pas de credentials dans le code      |
| HEALTHCHECK defini             | OK     | Vérifie /health toutes les 30s       |
| .dockerignore present          | OK     | Exclut node_modules, .git, .env      |
| Hadolint sans warning          | OK     | 0 avertissement, 0 erreur            |
| Taille image                   | OK     | 177 Mo (-89% vs image naive)         |
| DevDependencies exclues        | OK     | npm ci --omit=dev                    |
| Layers optimises               | OK     | 99.9997% efficacite (dive)           |
| HEALTHCHECK valide             | OK     | Status: healthy confirmé             |

---

## 6. Conclusion

L'image de production lab-api:v1.0.0 respecte les standards industriels :

- **Taille** : 177 Mo soit une reduction de 89% par rapport à l'image naive (1.59 Go)
- **Securite** : aucun shell ni package manager dans l'image finale
- **Utilisateur** : non-root (USER nonroot)
- **Sante** : HEALTHCHECK fonctionnel (Status: healthy validé)
- **Qualite** : Hadolint 0 warning, dive 99.9997% efficacite
- **CVE residuelles** : 1 CRITICAL (libssl3) liée à l'image de base distroless,
  non corrigeable par notre code, documentée avec plan de remédiation.
  Les CVE Node.js (body-parser, path-to-regexp) sont liées à express 4.18.2
  et seront corrigées lors de la mise à jour vers express 5.x en Phase 2.

Ce rapport constitue le livrable Phase 1 de la formation Kubernetes K3s.
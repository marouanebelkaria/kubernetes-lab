-- Script d'initialisation execute au premier demarrage du conteneur

CREATE TABLE IF NOT EXISTS items (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO items (name) VALUES ('Item Alpha');
INSERT INTO items (name) VALUES ('Item Beta');
INSERT INTO items (name) VALUES ('Item Gamma');
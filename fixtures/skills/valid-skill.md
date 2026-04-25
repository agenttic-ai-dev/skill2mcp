---
name: docx-generator
version: 1.0.0
description: Genera documentos Word a partir de markdown estructurado
tags:
  - documents
  - office
---

## Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| content | string | yes |  | Contenido en markdown |
| template | string | no | default | Nombre del template .docx |
| title | string | yes |  | Titulo del documento |

## Examples
**Input:** `{ content: "# Hola", title: "Reporte" }`
**Output:** Archivo reporte.docx generado en /outputs/

## Triggers
- "crear un word"
- "generar documento"
- "escribir un reporte"

## Notes
Esta skill usa plantillas internas.

# ROADMAP

## Fase 0 - Especificación y contratos

### Objetivo
Definir de forma inequívoca el contrato de entrada (`SKILL.md`) y salida (definición de tool MCP/jRPC), junto con los criterios de aceptación del MVP.

### Tareas
- Definir formato canónico de `SKILL.md` (frontmatter, secciones, tabla de parámetros, ejemplos, triggers).
- Definir comportamiento esperado para formato no canónico en modos `tolerant` y `semantic`.
- Especificar el IR `SkillDocument` como contrato interno estable.
- Especificar el contrato de salida para tool MCP/jRPC y `tools.json`.
- Definir catálogo mínimo de fixtures (válidos, ambiguos e inválidos).
- Documentar criterios de aceptación funcional para single-skill y multi-skill.

## Fase 1 - Parsing determinístico

### Objetivo
Construir el pipeline de ingesta y parsing determinístico para convertir `SKILL.md` en `SkillDocument` con trazabilidad de errores.

### Tareas
- Implementar `FileLoader` para archivo único, directorio y glob.
- Implementar extracción de frontmatter (`name`, `version`, `description`, `tags`, metadatos adicionales).
- Implementar `SectionExtractor` para secciones estándar (Parameters, Examples, Triggers, Notes).
- Implementar `TableParser` para parámetros desde markdown table.
- Implementar validaciones de estructura y mensajes de error por archivo/sección.
- Implementar modos de parseo `strict` y `tolerant`.
- Exponer comando `parse` con salida JSON del IR.

## Fase 2 - Transformación a tool MCP/jRPC

### Objetivo
Transformar el IR en definiciones de tool válidas para MCP, con schemas consistentes y validación previa a generación.

### Tareas
- Implementar `SchemaBuilder` para mapear tipos del IR a JSON Schema.
- Implementar normalización de tipos complejos (enum, array, object, defaults, required).
- Implementar `ToolMapper` para construir definición completa de tool MCP/jRPC.
- Implementar `ToolValidator` con validaciones de contrato y errores accionables.
- Exponer comando `inspect` para salida `tools.json` y vista por tool.
- Garantizar que el output de una skill pueda registrarse en código en un MCP server.

## Fase 3 - Generación de paquete MCP desplegable

### Objetivo
Generar un sub-repo funcional listo para ejecutar y desplegar un MCP server con todas las tools del directorio.

### Tareas
- Implementar `ServerGenerator` con transporte `stdio` y `http`.
- Implementar registro automático de tools generadas.
- Implementar `HandlersGenerator` con stubs/mocks por tool.
- Implementar `TypesGenerator` para type-safety de handlers.
- Implementar `ManifestGenerator` para `package.json`, scripts, `tools.json` y archivos base.
- Generar README mínimo con instrucciones de ejecución y extensión.
- Exponer comando `build` para salida en `--out`.

## Fase 4 - CLI productiva y flujo de lote

### Objetivo
Consolidar una experiencia CLI estable para uso diario en repositorios reales.

### Tareas
- Diseñar comandos `parse`, `inspect`, `build` y opciones globales.
- Soportar `--transport stdio|http|both`.
- Soportar `--mode strict|tolerant|semantic` en cascada configurable.
- Implementar modo `--watch` con regeneración incremental por cambios de archivo.
- Estandarizar códigos de salida de CLI y formato de logs.
- Mejorar DX de errores (contexto de archivo, sección y sugerencia de corrección).

## Fase 5 - Fallback semántico opcional

### Objetivo
Completar campos faltantes del IR mediante extracción semántica controlada cuando el parser determinístico no alcanza cobertura suficiente.

### Tareas
- Implementar `SemanticExtractor` activado solo bajo `--semantic`.
- Limitar extracción a campos ausentes o ambiguos del IR.
- Definir prompt estructurado y formato de respuesta JSON estricto.
- Implementar validación posterior al fallback para evitar degradación del contrato.
- Implementar cache de resultados semánticos para reducir costo en ejecuciones repetidas.
- Registrar trazabilidad de campos completados por fallback.

## Fase 6 - Calidad, cumplimiento y release

### Objetivo
Garantizar robustez del producto, empaquetado correcto y documentación para adopción.

### Tareas
- Implementar suite de tests unitarios para parser, transformer y generator.
- Implementar tests de integración end-to-end para single-skill y multi-skill.
- Añadir pruebas de compatibilidad de registro de tools en servidor MCP.
- Ejecutar validación de calidad de código (lint, typecheck, pruebas).
- Definir y aplicar licencia dual `MIT OR Apache-2.0`.
- Publicar guía de contribución, changelog inicial y checklist de release.

## Entregables del MVP

- Conversión de una única `SKILL.md` a definición de tool MCP/jRPC registrable en código.
- Generación de sub-repo desplegable con MCP server mínimo funcional a partir de un directorio de skills.
- Soporte de transporte `stdio` y `http`.
- Modo de parseo en cascada `strict -> tolerant -> semantic`.
- Handlers stub/mock listos para ser implementados.

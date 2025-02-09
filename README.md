# Fuel Discounts Tracker 🚗 💰 / Seguimiento de Descuentos de Nafta 🚗 💰

A modern web application to track and manage fuel discounts across different gas stations in Argentina. // Aplicación web moderna para seguir y gestionar descuentos en combustible en distintas estaciones de servicio de Argentina.

## Features ✨ / Características ✨
- **Multi-brand Support**: Track discounts for YPF, SHELL, AXION... // Soporte múltiples marcas: YPF, SHELL, AXION...
- **Advanced Filtering** // Filtrado avanzado:
  - Filter by fuel brands // Filtrar por marcas
  - Filter by days of the week // Filtrar por días de la semana
- **Smart Sorting** // Orden inteligente:
  - Sort by discount percentage // Ordenar por porcentaje de descuento
  - Sort by reimbursement limit // Ordenar por límite de reintegro
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Visual Indicators**:
  - Color-coded discount badges
  - Visual distinction for high-value reimbursement limits
  - Brand-specific color schemes
- **Anti-spam Measures**: Implements client-side debouncing and rate limiting on the "Recommend Discount" button using a cooldown timer (persisted in localStorage) to prevent rapid repeated submissions.

## Getting Started 🚀 / Comenzando 🚀

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for the database)

### Installation / Instalación
```bash
# Unified installation instructions
npm install
npm run dev  # Use consistent dev command instead of 'start'
```

## Database Schema 📊

The application uses Supabase with the following schema for the `discounts` table:

```sql
create table discounts (
  id uuid default uuid_generate_v4() primary key,
  fuel_brand text not null,
  day text not null,
  card_method text not null,
  discount integer not null,
  reimbursement_limit integer not null,
  frequency text,
  source_url text
);
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Tech Stack 🛠️ / Tecnologías 🛠️
- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide Icons

## License 📝 / Licencia 📝
MIT License - see [LICENSE](LICENSE) // Consulta el archivo LICENSE

## Acknowledgments 🙏

- Thanks to all contributors who help maintain and improve this project
- Inspired by the need to easily track and compare fuel discounts in Argentina

## Descripción

Este proyecto permite calcular y gestionar descuentos aplicables en la compra de nafta. El objetivo es facilitar la comparación de precios y proporcionar a los usuarios la información necesaria para tomar decisiones informadas.

## Características

- Comparación de precios de nafta.
- Gestión y aplicación de descuentos.
- Interfaz intuitiva y amigable.
- Información actualizada sobre promociones y ofertas.

## Instalación

1. Clona el repositorio:
   
   git clone https://github.com/tu_usuario/descuentos-nafta.git

2. Instala las dependencias (si aplica):
   
   npm install

## Uso

Para iniciar la aplicación, ejecuta:

   npm start

Luego, accede a la aplicación a través del navegador en la URL indicada.

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir mejoras o nuevas funcionalidades.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

## Contact 📧 / Contacto 📧
[your_email@domain.com] // [tu_email@dominio.com]
 

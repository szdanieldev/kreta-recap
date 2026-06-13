import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Kréta Recap',
        short_name: 'KrétaRecap',
        description: 'Az éved a Krétában',
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: '/icon.png',
                sizes: '200x200',
                type: 'image/png',
            },
        ],
    }
}
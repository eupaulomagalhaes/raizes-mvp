// Configuração centralizada de assets do Supabase Storage
const STORAGE_BASE_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co/storage/v1/object/public/game-assets'

export const GAME_ASSETS = {
  // Jogo: Onde Estão os Animais
  ondeEstaoOsAnimais: {
    scenery: {
      background: `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/background.png`,
      trees: [
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/trees/arvores.png`,
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/trees/pinheiros.png`,
      ],
      rocks: [
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/rocks/rocha.png`,
      ],
      bushes: [
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/bushes/arbusto.png`,
      ],
      clouds: [
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/clouds/nuvem.png`,
      ],
      structures: [
        `${STORAGE_BASE_URL}/onde-estao-os-animais/scenery/structures/cabana.png`,
      ],
    },
    animals: {
      urso: {
        id: 'urso',
        name: 'urso',
        article: 'o',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/urso.png`,
      },
      papagaio: {
        id: 'papagaio',
        name: 'papagaio',
        article: 'o',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/papagaio.png`,
      },
      coelho: {
        id: 'coelho',
        name: 'coelho',
        article: 'o',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/coelho.png`,
      },
      vaca: {
        id: 'vaca',
        name: 'vaca',
        article: 'a',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/vaca.png`,
      },
      veado: {
        id: 'veado',
        name: 'veado',
        article: 'o',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/veado.png`,
      },
      coruja: {
        id: 'coruja',
        name: 'coruja',
        article: 'a',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/coruja.png`,
      },
      aguia: {
        id: 'aguia',
        name: 'águia',
        article: 'a',
        image: `${STORAGE_BASE_URL}/onde-estao-os-animais/animals/aguia.png`,
      },
    },
  },
  
  // Assets compartilhados
  shared: {
    mascot: {
      // Placeholder emoji até ter o Don no Storage
      don: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐻</text></svg>',
    },
    animations: {
      confetti: 'https://lottie.host/3f3c0e4a-8e4a-4e4a-9c4a-0e4a3f3c0e4a/3f3c0e4a.json',
    },
  },
}

// Helper para pegar lista de animais
export const getAnimalsList = () => {
  return Object.values(GAME_ASSETS.ondeEstaoOsAnimais.animals)
}

// Helper para pegar elemento aleatório de cenário
export const getRandomSceneryElement = (type: 'trees' | 'rocks' | 'bushes' | 'clouds' | 'structures') => {
  const elements = GAME_ASSETS.ondeEstaoOsAnimais.scenery[type]
  return elements[Math.floor(Math.random() * elements.length)]
}

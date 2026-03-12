import { useState, useRef, useEffect } from "react"

type Produto = {
  nome: string
  descricao: string
  preco: string
  imagem: string
  tag: string
}

export default function RoletaAdmin() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [premios, setPremios] = useState([
    "Desconto de 10%",
    "Frete Grátis",
    "Nada 😢",
  ])

  const [produtos, setProdutos] = useState<Produto[]>([
    {
      nome: "Câmera Profissional",
      descricao: "Camera",
      preco: "R$299",
      imagem:
        "https://images.unsplash.com/photo-1519183071298-a2962be96eec?w=200",
      tag: "PRODUTO",
    },
    {
      nome: "Smartphone Ultra",
      descricao: "SMX",
      preco: "R$999",
      imagem:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200",
      tag: "PRODUTO",
    },
    {
      nome: "Headset Bluetooth",
      descricao: "PRO",
      preco: "R$199",
      imagem:
        "https://images.unsplash.com/photo-1518441902110-7f7c37fdfb8b?w=200",
      tag: "PRODUTO",
    },
  ])

  const size = 260

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const radius = size / 2
    const arc = (2 * Math.PI) / premios.length

    ctx.clearRect(0, 0, size, size)

    premios.forEach((premio, i) => {
      const angle = i * arc

      ctx.beginPath()
      ctx.fillStyle = i % 2 === 0 ? "#FFC107" : "#000"
      ctx.moveTo(radius, radius)
      ctx.arc(radius, radius, radius, angle, angle + arc)
      ctx.fill()

      ctx.save()
      ctx.translate(radius, radius)
      ctx.rotate(angle + arc / 2)
      ctx.fillStyle = i % 2 === 0 ? "#000" : "#fff"
      ctx.font = "bold 14px Inter"
      ctx.textAlign = "right"
      ctx.fillText(premio, radius - 10, 5)
      ctx.restore()
    })
  }

  useEffect(() => {
    drawWheel()
  }, [premios])

  const handlePremioChange = (i: number, value: string) => {
    const novo = [...premios]
    novo[i] = value
    setPremios(novo)
  }

  const addPremio = () => {
    setPremios([...premios, "Novo prêmio"])
  }

  const removePremio = (i: number) => {
    setPremios(premios.filter((_, idx) => idx !== i))
  }

  const addProduto = () => {
    setProdutos([
      ...produtos,
      { nome: "", descricao: "", preco: "", imagem: "", tag: "" },
    ])
  }

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Inter, sans-serif",
        background: "#F5F6F7",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* GRID SUPERIOR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          marginBottom: 30,
        }}
      >
        {/* CARD PREMIOS */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <h3 style={{ margin: 0 }}>Prêmios da Roleta</h3>

            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#FF9800",
              }}
            >
              {premios.length} ELEMENTOS
            </span>
          </div>

          {premios.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <input
                value={p}
                onChange={(e) => handlePremioChange(i, e.target.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />

              <button
                onClick={() => removePremio(i)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              onClick={addPremio}
              style={{
                background: "#FFD54F",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Adicionar Prêmio
            </button>

            <button
              style={{
                background: "#222",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Salvar Configuração
            </button>
          </div>
        </div>

        {/* PREVIEW ROLETA */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h4>Pré-visualização da Roleta</h4>

          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{
              marginTop: 10,
            }}
          />

          <p
            style={{
              fontSize: 12,
              color: "#999",
              marginTop: 10,
            }}
          >
            A roleta acima mostra exatamente como ficará para o cliente.
          </p>
        </div>
      </div>

      {/* PRODUTOS */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Produtos em Destaque</h3>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <input
            placeholder="ID do Produto"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />

          <input
            placeholder="Buscar Rápido"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />

          <button
            onClick={addProduto}
            style={{
              background: "#FFC107",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Adicionar Produto
          </button>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {produtos.map((p, i) => (
            <div
              key={i}
              style={{
                width: 180,
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 10,
                position: "relative",
              }}
            >
              <button
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>

              <img
                src={p.imagem}
                style={{
                  width: "100%",
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />

              <p
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  margin: "10px 0 4px",
                }}
              >
                {p.nome}
              </p>

              <span style={{ fontSize: 12, color: "#777" }}>
                {p.descricao}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
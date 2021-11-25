import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { toast } from "react-toastify"
import { api } from "../services/api"
import { Product, Stock } from "../types"

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  useEffect(() => {
    console.log(cart)
  }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]

      const productExists = updatedCart.find(
        (product) => product.id === productId
      )

      const stock = await api.get(`/stock/${productId}`)
      const productAmount = productExists ? productExists.amount : 0

      if (productAmount >= stock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      if (productExists) {
        productExists.amount += 1
      } else {
        const { data } = await api.get(`/products/${productId}`)

        const newProduct = { ...data, amount: 1 }
        updatedCart.push(newProduct)
      }

      setCart([...updatedCart])
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
    } catch {
      toast.error("Erro na adição do produto")
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExist = updatedCart.findIndex(
        (product) => product.id === productId
      )
      if (!(productExist >= 0)) {
        throw new Error()
      }
      updatedCart.splice(productExist, 1)
      setCart([...updatedCart])
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
    } catch {
      toast.error("Erro na remoção do produto")
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }
      const { data } = await api.get<Stock>(`/stock/${productId}`)

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      const updatedCart = [...cart]
      const productExists = updatedCart.find(
        (produto) => produto.id === productId
      )

      if (productExists) {
        productExists.amount = amount
        setCart([...updatedCart])
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto")
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}

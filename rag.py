from pathlib import Path

import streamlit as st
from langchain_chroma import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel, Field, SecretStr

VOCAREUM_BASE_URL = "https://openai.vocareum.com/v1"
DATA_DIR = Path(__file__).parent / "data"
INDEX_DIR = Path(__file__).parent / ".chroma"


class VocareumSettings(BaseModel):
    api_key: SecretStr
    base_url: str = VOCAREUM_BASE_URL
    chat_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"


class Corpus(BaseModel):
    directory: Path
    file_names: list[str] = Field(min_length=1)


class IndexedCorpus(BaseModel):
    file_names: list[str]
    skipped: list[str] = Field(default_factory=list)
    chunk_count: int = Field(ge=0)


def load_corpus(directory: Path, file_names: tuple[str, ...]) -> tuple[list, list[str]]:
    documents = []
    skipped: list[str] = []
    for name in file_names:
        try:
            documents.extend(PyPDFLoader(str(directory / name)).load())
        except Exception:
            skipped.append(name)
    if not documents:
        raise RuntimeError("None of the PDFs could be read.")
    return documents, skipped


def list_corpus(directory: Path) -> Corpus:
    file_names = sorted(path.name for path in directory.glob("*.pdf"))
    if not file_names:
        raise FileNotFoundError(f"No PDF files in {directory}")
    return Corpus(directory=directory, file_names=file_names)

@st.cache_resource(show_spinner="Indexing corpus…")
def build_retriever(api_key: str, _file_names: tuple[str, ...]):
    settings = VocareumSettings(api_key=SecretStr(api_key))
    documents, skipped = load_corpus(DATA_DIR, _file_names)
    chunks = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    ).split_documents(documents)
    embeddings = OpenAIEmbeddings(
        api_key=settings.api_key.get_secret_value(),
        base_url=settings.base_url,
        model=settings.embedding_model,
    )
    vectorstore = Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=str(INDEX_DIR),
    )
    indexed = IndexedCorpus(
        file_names=[name for name in _file_names if name not in skipped],
        skipped=skipped,
        chunk_count=len(chunks),
    )
    return vectorstore.as_retriever(search_kwargs={"k": 4}), indexed


def build_chain(api_key: str, retriever):
    settings = VocareumSettings(api_key=SecretStr(api_key))
    llm = ChatOpenAI(
        api_key=settings.api_key.get_secret_value(),
        base_url=settings.base_url,
        model=settings.chat_model,
        temperature=0,
    )
    prompt = ChatPromptTemplate.from_template(
        "Answer the question using only the context below. "
        "If the context does not contain the answer, say so. "
        "Cite the source file when you use a passage.\n\n"
        "Context:\n{context}\n\n"
        "Question: {input}"
    )
    document_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, document_chain)


st.title("Be guided with stress and mental health. Let's have a chat?")

api_key = st.sidebar.text_input("Vocareum API Key", type="password")
st.sidebar.caption(f"Endpoint: `{VOCAREUM_BASE_URL}`")

try:
    corpus = list_corpus(DATA_DIR)
except FileNotFoundError as exc:
    st.error(str(exc))
    st.stop()

st.sidebar.write("Corpus")
for name in corpus.file_names:
    st.sidebar.write(f"- {name}")

if not api_key:
    st.info("Enter a Vocareum API key to index the corpus and ask questions.")
    st.stop()

retriever, indexed = build_retriever(api_key, tuple(corpus.file_names))
rag_chain = build_chain(api_key, retriever)
st.success(
    f"Indexed {indexed.chunk_count} chunks from {len(indexed.file_names)} PDFs."
)
if indexed.skipped:
    st.warning("Skipped unreadable PDFs: " + ", ".join(indexed.skipped))

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    st.chat_message(message["role"]).write(message["content"])

if prompt := st.chat_input("What do you want to know about stress and mental health management?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)
    response = rag_chain.invoke({"input": prompt})
    answer = response["answer"]
    st.session_state.messages.append({"role": "assistant", "content": answer})
    st.chat_message("assistant").write(answer)

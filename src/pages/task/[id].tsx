import { ChangeEvent, FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import styles from './styles.module.css'
import { GetServerSideProps } from "next";

import { db } from '../../services/firebaseConnection'
import { doc,collection, query, where, getDoc, addDoc, getDocs, deleteDoc } from "firebase/firestore";

import { Textarea } from "../../components/textarea";
import { FaTrash } from "react-icons/fa";

interface TaskProps {
    item: {
        taskId: string;
        task: string;
        public: boolean;
        created: string;
        user: string;
    }
    allComments: CommentProps[];
}

interface CommentProps{
    id: string;
    comment: string;
    taskId: string;
    user: string;
    name: string;
}

export default function task({ item, allComments }: TaskProps) {

    const { data: session } = useSession();
    const [comment, setComment] = useState('');
    const [commentsList, setCommentsList] = useState<CommentProps[]>(allComments || []);

    async function handleComment(event: FormEvent) {
        event.preventDefault();

        if(comment === '' || comment.length < 3){
            alert('Preencha o campo de comentário corretamente!');
            return;
        }

        if(!session?.user?.email || !session?.user?.name) return;

        try{
            const docRef = await addDoc(collection(db, "comments"), {
                comment: comment,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user.name,
                taskId: item?.taskId,
            })

            const data = {
                id: docRef.id,
                comment: comment,
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId
            }

            setCommentsList((oldItems) => [...oldItems, data]);

            setComment('');
        }catch(error) {
            console.log(error);
            alert('Erro ao comentar, tente mais tarde!');
            setComment('');
            return;
        }
    }

    async function handleDeleteComment(id: string) {
        try{
            const docRef = doc(db, 'comments', id)
            await deleteDoc(docRef);

            const updatedComments = commentsList.filter((commentItem) => commentItem.id !== id);
            setCommentsList(updatedComments);

            alert('Comentário deletado com sucesso!');


        }catch(error) {
            console.log(error);
            alert('Erro ao deletar comentário, tente mais tarde!');
    }}

    return(
        <div className={styles.container}>
            <Head>
                <title>Detalhes da tarefa</title>

                <main className={styles.main}>
                    <h1>Tarefa</h1>

                    <article className={styles.task}>
                        <p>{item.task}</p>
                    </article>

                    <section className={styles.commentsContainer}>
                        <h2>Deixar comentário</h2>

                        <form onSubmit={handleComment}>
                            <Textarea
                            value={comment}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)}
                            placeholder="Escreva seu comentário" />
                            <button 
                            disabled={!session?.user} 
                            className={styles.button}>
                                Comentar
                            </button>
                        </form>
                    </section>

                    <section className={styles.commentsContainer}>
                        <h2>Todos os comentários</h2>
                        {commentsList.length === 0 && (
                            <span>Nenhum comentário foi encontrado...</span>
                        )}

                        {commentsList.map(commentItem => (
                            <article key={commentItem.id} className={styles.comment}>
                                <div className={styles.headComment}>
                                    <label className={styles.commentsLabel}>{commentItem.name}</label>
                                {commentItem.user === session?.user?.email && (
                                    <button className={styles.buttonTrash}>
                                        <FaTrash size={18} color="#EA3140" onClick={() => handleDeleteComment(commentItem.id)} />
                                    </button>
                                )}
                                </div>
                                <p>{commentItem.comment}</p>
                            </article>
                        ))}
                    </section>
                </main>
            </Head>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

    const id = params?.id as string;

    const docRef = doc(db, 'task', id);

    const q = query(collection(db, 'comments'), where('taskId', '==', id));
    const snapshotComments = await getDocs(q);

    let allComments: CommentProps[] = [];

    snapshotComments.forEach((doc) => allComments.push({
        id: doc.id,
        comment: doc.data().comment,
        user: doc.data().user,
        name: doc.data().name,
        taskId: doc.data().taskId
    }))

    const snapshot = await getDoc(docRef);

    if(snapshot.data() === undefined){
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    if(!snapshot.data()?.public === false){
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    const milliseconds = snapshot.data()?.created.seconds * 1000;

    const task = {
        taskId: id,
        task: snapshot.data()?.task,
        public: snapshot.data()?.public,
        created: new Date(milliseconds).toLocaleDateString(),
        user: snapshot.data()?.user
    }

    return{
        props: {
            item: task,
            allComments: allComments
        }
    }
}
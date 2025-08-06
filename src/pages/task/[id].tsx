import { ChangeEvent, FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import styles from './styles.module.css'
import { GetServerSideProps } from "next";

import { db } from '../../services/firebaseConnection'
import { doc,collection, query, where, getDoc, addDoc } from "firebase/firestore";
import { use } from "react";
import { Textarea } from "../../components/textarea";

interface TaskProps {
    item: {
        taskId: string;
        task: string;
        public: boolean;
        created: string;
        user: string;
    }
}

export default function task({ item }: TaskProps) {

    const { data: session } = useSession();
    const [comment, setComment] = useState('');

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

            setComment('');
        }catch(error) {
            console.log(error);
            alert('Erro ao comentar, tente mais tarde!');
            setComment('');
            return;
        }
    }

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
                </main>
            </Head>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

    const id = params?.id as string;

    const docRef = doc(db, 'task', id);
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
            item: task
        }
    }
}
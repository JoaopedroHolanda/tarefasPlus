import Head from "next/head";
import styles from './styles.module.css'
import { GetServerSideProps } from "next";

import { db } from '../../services/firebaseConnection'
import { doc,collection, query, where, getDoc } from "firebase/firestore";
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

                        <form>
                            <Textarea placeholder="Escreva seu comentário" />
                            <button className={styles.button}>Comentar</button>
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
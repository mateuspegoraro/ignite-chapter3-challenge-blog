import { GetStaticPaths, GetStaticProps } from 'next';
import { FaCalendar, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  formatted__first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);

  useEffect(() => {
    setPosts(
      results.map(post => {
        return {
          ...post,
          formatted__first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
        };
      })
    );
  }, [results]);

  const [nextPage, setNextPage] = useState(next_page);

  useEffect(() => {
    console.log(posts);
  }, []);

  async function handlePagination() {
    const response = await fetch(nextPage).then(res => res.json());

    const post = response.results.map(postResp => {
      return {
        uid: postResp.uid,
        first_publication_date: postResp.first_publication_date,
        data: {
          title: postResp.data.title,
          subtitle: postResp.data.subtitle,
          author: postResp.data.author,
        },
      };
    });

    setPosts(prevState => [...prevState, post[0]]);
    setNextPage(response.next_page);
  }

  return (
    <>
      <section className={styles.postContainer}>
        {posts.map(post => (
          <article
            className={styles.postContent}
            key={`${post.uid}-${new Date().getUTCMilliseconds()}`}
          >
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <h2>{post.data.subtitle}</h2>
              </a>
            </Link>
            <div>
              <time>
                <FaCalendar />
                {post.formatted__first_publication_date}
              </time>
              <p>
                <FaUser />
                {post.data.author}
              </p>
            </div>
          </article>
        ))}
        {nextPage && (
          <button
            type="button"
            onClick={handlePagination}
            className={styles.btnLoadPosts}
          >
            Carregar mais posts
          </button>
        )}
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts');
  // TODO

  const posts = await postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
